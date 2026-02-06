import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateGastoFijoRequestDto } from './dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from './dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from './dto/search-gasto-fijo-request.dto';
import { CreateGastoFijoBulkRequestDto } from './dto/create-gasto-fijo-bulk-request.dto';
import { GastoFijoDTO, MisGastosFijosDTO, MisGastosFijosResponseDTO } from './dto/gasto-fijo.dto';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { UsuarioRepository } from '../usuario/repository/usuario.repository';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { GastoFijoPago } from './entities/gasto-fijo-pago.entity';
import { MesEnum } from 'src/common/enums/mes-enum';

@Injectable()
export class GastoFijoService {
  constructor(
    private gastoFijoMapper: GastoFijoMapper,
    private gastoFijoRepository: GastoFijoRepository,
    private categoriaRepository: CategoriaRepository,
    private usuarioRepository: UsuarioRepository,
    @Inject(forwardRef(() => InfoInicialRepository))
    private infoInicialRepository: InfoInicialRepository,
    @Inject(forwardRef(() => GastoFijoPagoRepository))
    private gastoFijoPagoRepository: GastoFijoPagoRepository,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<GastoFijoDTO> {
    const gastoFijo = await this.gastoFijoRepository.findOne({
      where: { id: id },
      relations: ['categoria', 'usuario'],
    });

    if (!gastoFijo) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (gastoFijo.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para ver este gasto fijo',
        details: JSON.stringify({ id }),
      });
    }

    return await this.gastoFijoMapper.entity2DTO(gastoFijo);
  }

  async search(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<PageDto<GastoFijoDTO>> {
    const gastoFijoPage = await this.gastoFijoRepository.search(request, usuarioId);
    return this.gastoFijoMapper.page2Dto(request, gastoFijoPage);
  }

  async getMisGastosFijos(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<MisGastosFijosResponseDTO> {
    // Obtener el usuario
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Usuario no encontrado',
        details: JSON.stringify({ usuarioId }),
      });
    }

    const gastoFijoPage = await this.gastoFijoRepository.search(request, usuarioId);
    return this.gastoFijoMapper.page2MisGastosFijosResponseDto(request, gastoFijoPage, usuario);
  }

  async create(request: CreateGastoFijoRequestDto, usuarioId: number): Promise<GastoFijoDTO> {
    try {
      // Validar que la categoría existe
      const categoria = await this.categoriaRepository.findOne({
        where: { id: request.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Categoría no encontrada',
          details: JSON.stringify({ categoriaId: request.categoriaId }),
        });
      }

      // Validar que el usuario existe
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Usuario no encontrado',
          details: JSON.stringify({ usuarioId }),
        });
      }

      // Validar que no exista otro gasto fijo con el mismo nombre para este usuario
      const gastoFijoExistente = await this.gastoFijoRepository
        .createQueryBuilder('gastoFijo')
        .where('gastoFijo.usuario = :usuarioId', { usuarioId })
        .andWhere('LOWER(gastoFijo.nombre) = LOWER(:nombre)', { nombre: request.nombre })
        .getOne();

      if (gastoFijoExistente) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Ya existe un gasto fijo con ese nombre para este usuario',
          details: JSON.stringify({ nombre: request.nombre }),
        });
      }

      // Crear el gasto fijo
      const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(request, categoria);
      newGastoFijo.usuario = usuario;
      const gastoFijoSaved = await this.gastoFijoRepository.save(newGastoFijo);

      // Crear automáticamente el GastoFijoPago para el mes actual si existe InfoInicial
      await this.crearGastoFijoPagoParaMesActual(gastoFijoSaved.id, usuarioId);

      // Buscar el gasto fijo guardado con relaciones
      const searchGastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: gastoFijoSaved.id },
        relations: ['categoria', 'usuario'],
      });

      if (!searchGastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: gastoFijoSaved.id }),
        });
      }

      return this.gastoFijoMapper.entity2DTO(searchGastoFijo);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async update(
    id: number,
    request: UpdateGastoFijoRequestDto,
    usuarioId: number,
  ): Promise<GastoFijoDTO> {
    try {
      // Verificar que el gasto fijo existe y pertenece al usuario
      const gastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: id },
        relations: ['categoria', 'usuario'],
      });

      if (!gastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      if (gastoFijo.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para modificar este gasto fijo',
          details: JSON.stringify({ id }),
        });
      }

      // Validar y cargar categoría si se está actualizando
      let categoria = gastoFijo.categoria;
      if (request.categoriaId !== undefined && request.categoriaId !== gastoFijo.categoria?.id) {
        const nuevaCategoria = await this.categoriaRepository.findOne({
          where: { id: request.categoriaId },
        });

        if (!nuevaCategoria) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Categoría no encontrada',
            details: JSON.stringify({ categoriaId: request.categoriaId }),
          });
        }
        categoria = nuevaCategoria;
      }

      // Validar que si se cambia el nombre, no exista otro gasto fijo con ese nombre para este usuario
      if (request.nombre !== undefined && request.nombre.toLowerCase() !== gastoFijo.nombre.toLowerCase()) {
        const gastoFijoExistente = await this.gastoFijoRepository
          .createQueryBuilder('gastoFijo')
          .where('gastoFijo.usuario = :usuarioId', { usuarioId })
          .andWhere('LOWER(gastoFijo.nombre) = LOWER(:nombre)', { nombre: request.nombre })
          .andWhere('gastoFijo.id != :idActual', { idActual: id })
          .getOne();

        if (gastoFijoExistente) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Ya existe otro gasto fijo con ese nombre para este usuario',
            details: JSON.stringify({ nombre: request.nombre }),
          });
        }
      }

      // Actualizar el gasto fijo
      const updateGastoFijo = this.gastoFijoMapper.updateDTO2Entity(gastoFijo, request, categoria);
      await this.gastoFijoRepository.save(updateGastoFijo);

      // Buscar el gasto fijo actualizado
      const searchGastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: id },
        relations: ['categoria', 'usuario'],
      });

      if (!searchGastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.gastoFijoMapper.entity2DTO(searchGastoFijo);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    const gastoFijo = await this.gastoFijoRepository.findOne({
      where: { id: id },
      relations: ['usuario'],
    });

    if (!gastoFijo) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (gastoFijo.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar este gasto fijo',
        details: JSON.stringify({ id }),
      });
    }

    await this.gastoFijoRepository.softRemove(gastoFijo);
    return 'Gasto fijo eliminado correctamente';
  }

  async createBulk(request: CreateGastoFijoBulkRequestDto, usuarioId: number): Promise<GastoFijoDTO[]> {
    try {
      // Validar que el usuario existe
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Usuario no encontrado',
          details: JSON.stringify({ usuarioId }),
        });
      }

      // Obtener todos los IDs de categorías únicos
      const categoriaIds = [...new Set(request.gastosFijos.map(gf => gf.categoriaId))];
      
      // Validar que todas las categorías existen
      const categorias = await this.categoriaRepository.find({
        where: categoriaIds.map(id => ({ id })),
      });

      if (categorias.length !== categoriaIds.length) {
        const categoriasEncontradas = new Set(categorias.map(c => c.id));
        const categoriasNoEncontradas = categoriaIds.filter(id => !categoriasEncontradas.has(id));
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Una o más categorías no fueron encontradas',
          details: JSON.stringify({ categoriaIds: categoriasNoEncontradas }),
        });
      }

      // Crear un mapa de categorías por ID para acceso rápido
      const categoriasMap = new Map(categorias.map(c => [c.id, c]));

      // Validar que no haya nombres duplicados en el array de la request
      const nombresEnRequest = request.gastosFijos.map(gf => gf.nombre.toLowerCase());
      const nombresUnicos = new Set(nombresEnRequest);
      if (nombresEnRequest.length !== nombresUnicos.size) {
        const nombresDuplicados = nombresEnRequest.filter((nombre, index) => nombresEnRequest.indexOf(nombre) !== index);
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No se pueden crear gastos fijos con nombres duplicados en la misma solicitud',
          details: JSON.stringify({ nombresDuplicados: [...new Set(nombresDuplicados)] }),
        });
      }

      // Validar que no existan gastos fijos con esos nombres para este usuario
      const nombresParaValidar = request.gastosFijos.map(gf => gf.nombre.toLowerCase());
      const gastosFijosExistentes = await this.gastoFijoRepository
        .createQueryBuilder('gastoFijo')
        .where('gastoFijo.usuario = :usuarioId', { usuarioId })
        .andWhere('LOWER(gastoFijo.nombre) IN (:...nombres)', { nombres: nombresParaValidar })
        .getMany();

      if (gastosFijosExistentes.length > 0) {
        const nombresExistentes = gastosFijosExistentes.map(gf => gf.nombre);
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Uno o más gastos fijos ya existen con esos nombres para este usuario',
          details: JSON.stringify({ nombresExistentes }),
        });
      }

      // Crear los gastos fijos
      const nuevosGastosFijos = request.gastosFijos.map(gastoFijoDto => {
        const categoria = categoriasMap.get(gastoFijoDto.categoriaId);
        if (!categoria) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Categoría no encontrada',
            details: JSON.stringify({ categoriaId: gastoFijoDto.categoriaId }),
          });
        }
        const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(gastoFijoDto, categoria);
        newGastoFijo.usuario = usuario;
        return newGastoFijo;
      });

      // Guardar todos los gastos fijos
      const gastosFijosGuardados = await this.gastoFijoRepository.save(nuevosGastosFijos);

      // Crear automáticamente los GastoFijoPago para el mes actual si existe InfoInicial
      for (const gastoFijoGuardado of gastosFijosGuardados) {
        await this.crearGastoFijoPagoParaMesActual(gastoFijoGuardado.id, usuarioId);
      }

      // Obtener los IDs de los gastos fijos guardados
      const ids = gastosFijosGuardados.map(gf => gf.id);

      // Buscar los gastos fijos guardados con relaciones
      const gastosFijosCompletos = await this.gastoFijoRepository.find({
        where: ids.map(id => ({ id })),
        relations: ['categoria', 'usuario'],
      });

      // Convertir a DTOs
      const dtos = await Promise.all(
        gastosFijosCompletos.map(gf => this.gastoFijoMapper.entity2DTO(gf))
      );

      return dtos;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  /**
   * Obtiene el mes actual en formato MesEnum
   */
  private obtenerMesActual(): MesEnum {
    const meses: MesEnum[] = [
      MesEnum.ENERO,
      MesEnum.FEBRERO,
      MesEnum.MARZO,
      MesEnum.ABRIL,
      MesEnum.MAYO,
      MesEnum.JUNIO,
      MesEnum.JULIO,
      MesEnum.AGOSTO,
      MesEnum.SEPTIEMBRE,
      MesEnum.OCTUBRE,
      MesEnum.NOVIEMBRE,
      MesEnum.DICIEMBRE,
    ];
    const fechaActual = new Date();
    return meses[fechaActual.getMonth()];
  }

  /**
   * Crea automáticamente un GastoFijoPago para el mes actual si existe InfoInicial
   */
  private async crearGastoFijoPagoParaMesActual(gastoFijoId: number, usuarioId: number): Promise<void> {
    try {
      const fechaActual = new Date();
      const anioActual = fechaActual.getFullYear();
      const mesActual = this.obtenerMesActual();

      // Buscar la InfoInicial del mes actual para el usuario
      const infoInicialActual = await this.infoInicialRepository.findByUsuarioAndMes(
        usuarioId,
        anioActual,
        mesActual as string,
      );

      // Si no existe InfoInicial para el mes actual, no crear el pago (no es un error)
      if (!infoInicialActual) {
        return;
      }

      // Verificar si ya existe un pago para este gasto fijo y esta InfoInicial
      const pagoExistente = await this.gastoFijoPagoRepository
        .createQueryBuilder('gastoFijoPago')
        .where('gastoFijoPago.gastoFijo = :gastoFijoId', { gastoFijoId })
        .andWhere('gastoFijoPago.infoInicial = :infoInicialId', { infoInicialId: infoInicialActual.id })
        .getOne();

      if (pagoExistente) {
        // Ya existe un pago para este mes, no crear otro
        return;
      }

      // Obtener el gasto fijo con su montoFijo
      const gastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: gastoFijoId },
      });

      if (!gastoFijo) {
        return;
      }

      // Crear el GastoFijoPago
      const nuevoPago = new GastoFijoPago();
      nuevoPago.gastoFijo = gastoFijo;
      nuevoPago.infoInicial = infoInicialActual;
      nuevoPago.montoPago = gastoFijo.montoFijo || 0;
      nuevoPago.pagado = false;

      await this.gastoFijoPagoRepository.save(nuevoPago);
    } catch (error) {
      // Si hay un error al crear el pago automático, lo registramos pero no fallamos la creación del gasto fijo
      console.error('Error al crear pago automático de gasto fijo para el mes actual:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
}
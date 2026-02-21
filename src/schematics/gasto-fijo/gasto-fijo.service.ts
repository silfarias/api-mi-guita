import { Injectable, HttpException, Inject, forwardRef, BadRequestException, NotFoundException } from '@nestjs/common';

import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { MesEnum } from 'src/common/enums/mes-enum';

import { Usuario } from '../usuario/entities/usuario.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';

import { GastoFijo } from './entities/gasto-fijo.entity';
import { PagoGastoFijo } from '../pagos-gasto-fijo/entities/pago-gasto-fijo.entity';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { PagoGastoFijoRepository } from '../pagos-gasto-fijo/repository/pago-gasto-fijo.repository';
import { GastoFijoDTO, MisGastosFijosResponseDTO } from './dto/gasto-fijo.dto';
import { CreateGastoFijoRequestDto } from './dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from './dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from './dto/search-gasto-fijo-request.dto';
import { CreateGastoFijoBulkRequestDto } from './dto/create-gasto-fijo-bulk-request.dto';

const RELATIONS = ['categoria', 'usuario', 'medioPago'] as const;

@Injectable()
export class GastoFijoService {
  constructor(
    private readonly gastoFijoMapper: GastoFijoMapper,
    private readonly gastoFijoRepository: GastoFijoRepository,
    private readonly categoriaRepository: CategoriaRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => InfoInicialRepository))
    private readonly infoInicialRepository: InfoInicialRepository,
    @Inject(forwardRef(() => PagoGastoFijoRepository))
    private readonly pagoGastoFijoRepository: PagoGastoFijoRepository,
    @Inject(forwardRef(() => MedioPagoRepository))
    private readonly medioPagoRepository: MedioPagoRepository,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<GastoFijoDTO> {
    try {
      const gastoFijo = await this.getEntityService.findById(GastoFijo, id, [...RELATIONS]);
      this.checkBelongsToUser(gastoFijo, usuarioId, 'ver');
      return this.gastoFijoMapper.entity2DTO(gastoFijo);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async getGastosFijosActivos(usuarioId: number): Promise<GastoFijoDTO[]> {
    const gastosFijos = await this.gastoFijoRepository.find({
      where: {
        usuario: { id: usuarioId }
      },
    });
    return Promise.all(
      gastosFijos.map((gastoFijo) => this.gastoFijoMapper.entity2DTO(gastoFijo)),
    );
  }

  async getMisGastosFijos(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<MisGastosFijosResponseDTO> {
    const usuario = await this.getEntityService.findById(Usuario, usuarioId);
    const gastoFijoPage = await this.gastoFijoRepository.search(request, usuarioId);
    return this.gastoFijoMapper.page2MisGastosFijosResponseDto(request, gastoFijoPage, usuario);
  }

  async create(request: CreateGastoFijoRequestDto, usuarioId: number): Promise<GastoFijoDTO> {
    try {
      await this.getEntityService.findById(Categoria, request.categoriaId);
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);

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

      // Validar lógica de débito automático
      if (request.esDebitoAutomatico) {
        // Si es débito automático, debe proporcionar medioPagoId
        if (!request.medioPagoId) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Si el gasto fijo es débito automático, debe proporcionar el ID del medio de pago',
            details: JSON.stringify({ esDebitoAutomatico: request.esDebitoAutomatico }),
          });
        }

        // Validar que el medio de pago existe
        const medioPago = await this.medioPagoRepository.findOne({
          where: { id: request.medioPagoId },
        });

        if (!medioPago) {
          this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { medioPagoId: request.medioPagoId });
        }
      } else {
        // Si no es débito automático, no debe tener medioPagoId
        if (request.medioPagoId) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Si el gasto fijo no es débito automático, no debe proporcionar medio de pago',
            details: JSON.stringify({ esDebitoAutomatico: request.esDebitoAutomatico, medioPagoId: request.medioPagoId }),
          });
        }
      }

      // Crear el gasto fijo
      const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(request);
      newGastoFijo.usuario = usuario;
      const gastoFijoSaved = await this.gastoFijoRepository.save(newGastoFijo);

      // Crear automáticamente el GastoFijoPago para el mes actual si existe InfoInicial
      await this.crearGastoFijoPagoParaMesActual(gastoFijoSaved.id, usuarioId);

      const withRelations = await this.getEntityService.findById(GastoFijo, gastoFijoSaved.id, [...RELATIONS]);
      return this.gastoFijoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(
    id: number,
    request: UpdateGastoFijoRequestDto,
    usuarioId: number,
  ): Promise<GastoFijoDTO> {
    try {
      const gastoFijo = await this.getEntityService.findById(GastoFijo, id, [...RELATIONS]);
      this.checkBelongsToUser(gastoFijo, usuarioId, 'modificar');

      // Validar categoría si se está actualizando
      if (request.categoriaId !== undefined && request.categoriaId !== gastoFijo.categoria?.id) {
        const categoriaExiste = await this.categoriaRepository.findOne({
          where: { id: request.categoriaId },
        });

        if (!categoriaExiste) {
          this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { categoriaId: request.categoriaId });
        }
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

      // Validar lógica de débito automático
      const esDebitoAutomatico = request.esDebitoAutomatico !== undefined ? request.esDebitoAutomatico : gastoFijo.esDebitoAutomatico;

      if (request.esDebitoAutomatico !== undefined || request.medioPagoId !== undefined) {
        if (esDebitoAutomatico) {
          // Si es débito automático, debe proporcionar medioPagoId
          const medioPagoId = request.medioPagoId !== undefined ? request.medioPagoId : gastoFijo.medioPago?.id;
          
          if (!medioPagoId) {
            throw new BadRequestException({
              code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
              message: 'Si el gasto fijo es débito automático, debe proporcionar el ID del medio de pago',
              details: JSON.stringify({ esDebitoAutomatico: esDebitoAutomatico }),
            });
          }

          // Validar que el medio de pago existe
          const medioPagoExiste = await this.medioPagoRepository.findOne({
            where: { id: medioPagoId },
          });

          if (!medioPagoExiste) {
            this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { medioPagoId });
          }
        } else {
          // Si no es débito automático, no debe tener medioPagoId
          if (request.medioPagoId !== undefined && request.medioPagoId !== null) {
            throw new BadRequestException({
              code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
              message: 'Si el gasto fijo no es débito automático, no debe proporcionar medio de pago',
              details: JSON.stringify({ esDebitoAutomatico: esDebitoAutomatico, medioPagoId: request.medioPagoId }),
            });
          }
        }
      }

      // Actualizar el gasto fijo
      const updateGastoFijo = this.gastoFijoMapper.updateDTO2Entity(gastoFijo, request);
      await this.gastoFijoRepository.save(updateGastoFijo);

      const withRelations = await this.getEntityService.findById(GastoFijo, id, [...RELATIONS]);
      return this.gastoFijoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const gastoFijo = await this.getEntityService.findById(GastoFijo, id, ['usuario']);
      this.checkBelongsToUser(gastoFijo, usuarioId, 'eliminar');
      await this.gastoFijoRepository.softRemove(gastoFijo);
      return 'Gasto fijo eliminado correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async createBulk(request: CreateGastoFijoBulkRequestDto, usuarioId: number): Promise<GastoFijoDTO[]> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);

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

      // Validar medios de pago para débitos automáticos
      const medioPagoIds = [...new Set(request.gastosFijos.filter(gf => gf.medioPagoId).map(gf => gf.medioPagoId!))];
      
      if (medioPagoIds.length > 0) {
        const mediosPago = await this.medioPagoRepository.find({
          where: medioPagoIds.map(id => ({ id })),
        });

        if (mediosPago.length !== medioPagoIds.length) {
          const mediosPagoEncontrados = new Set(mediosPago.map(mp => mp.id));
          const mediosPagoNoEncontrados = medioPagoIds.filter(id => !mediosPagoEncontrados.has(id));
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Uno o más medios de pago no fueron encontrados',
            details: JSON.stringify({ medioPagoIds: mediosPagoNoEncontrados }),
          });
        }
      }

      // Validar lógica de débito automático para cada gasto fijo
      for (const gastoFijoDto of request.gastosFijos) {
        if (gastoFijoDto.esDebitoAutomatico) {
          if (!gastoFijoDto.medioPagoId) {
            throw new BadRequestException({
              code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
              message: `El gasto fijo "${gastoFijoDto.nombre}" es débito automático pero no tiene medio de pago asignado`,
              details: JSON.stringify({ nombre: gastoFijoDto.nombre }),
            });
          }
        } else {
          if (gastoFijoDto.medioPagoId) {
            throw new BadRequestException({
              code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
              message: `El gasto fijo "${gastoFijoDto.nombre}" no es débito automático pero tiene medio de pago asignado`,
              details: JSON.stringify({ nombre: gastoFijoDto.nombre }),
            });
          }
        }
      }

      // Crear los gastos fijos
      const nuevosGastosFijos = request.gastosFijos.map(gastoFijoDto => {
        const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(gastoFijoDto);
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
        relations: ['categoria', 'usuario', 'medioPago'],
      });

      // Convertir a DTOs
      const dtos = await Promise.all(
        gastosFijosCompletos.map(gf => this.gastoFijoMapper.entity2DTO(gf))
      );

      return dtos;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

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
      const pagoExistente = await this.pagoGastoFijoRepository
        .createQueryBuilder('pagoGastoFijo')
        .where('pagoGastoFijo.gastoFijo = :gastoFijoId', { gastoFijoId })
        .andWhere('pagoGastoFijo.infoInicial = :infoInicialId', { infoInicialId: infoInicialActual.id })
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
      const nuevoPago = new PagoGastoFijo();
      nuevoPago.gastoFijo = gastoFijo;
      nuevoPago.infoInicial = infoInicialActual;
      nuevoPago.montoPago = gastoFijo.montoFijo || 0;
      nuevoPago.pagado = false;

      await this.pagoGastoFijoRepository.save(nuevoPago);
    } catch (error) {
      console.error('Error al crear pago automático de gasto fijo para el mes actual:', error);
    }
  }

  private checkBelongsToUser(gastoFijo: GastoFijo, usuarioId: number, accion: string): void {
    if (gastoFijo.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, `No tienes permiso para ${accion} este gasto fijo`);
    }
  }
}
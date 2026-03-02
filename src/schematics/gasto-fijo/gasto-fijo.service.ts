import { Injectable, HttpException, Inject, forwardRef, NotFoundException } from '@nestjs/common';

import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { MesEnum } from 'src/common/enums/mes-enum';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';

import { Usuario } from '../usuario/entities/usuario.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';

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

const RELATIONS = ['categoria', 'usuario'] as const;

@Injectable()
export class GastoFijoService {
  constructor(
    private readonly gastoFijoMapper: GastoFijoMapper,
    private readonly gastoFijoRepository: GastoFijoRepository,
    private readonly categoriaRepository: CategoriaRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => PagoGastoFijoRepository))
    private readonly pagoGastoFijoRepository: PagoGastoFijoRepository,
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
    const gastosFijos = await this.gastoFijoRepository.getGastosFijosActivos(usuarioId);
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
      const categoria = await this.getEntityService.findById(Categoria, request.categoriaId);
      if (categoria.tipo !== TipoCategoriaEnum.EGRESO) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          { message: 'La categoría del gasto fijo debe ser de tipo EGRESO', categoriaId: request.categoriaId },
        );
      }
      const diaVen = new Date(request.diaVencimiento);
      const dia = diaVen.getDate();
      if (dia < 1 || dia > 31) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          { message: 'El día de vencimiento debe estar entre 1 y 31', diaVencimiento: request.diaVencimiento },
        );
      }
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);

      const gastoFijoExistente = await this.gastoFijoRepository
        .createQueryBuilder('gastoFijo')
        .where('gastoFijo.usuario = :usuarioId', { usuarioId })
        .andWhere('LOWER(gastoFijo.nombre) = LOWER(:nombre)', { nombre: request.nombre })
        .getOne();

      if (gastoFijoExistente) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          { message: 'Ya existe un gasto fijo con ese nombre para este usuario', nombre: request.nombre },
        );
      }

      const newGastoFijo = await this.gastoFijoMapper.createDTO2Entity(request);
      newGastoFijo.usuario = usuario;
      const gastoFijoSaved = await this.gastoFijoRepository.save(newGastoFijo);

      await this.crearPagoGastoFijoParaMesActual(gastoFijoSaved.id, usuarioId);

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

      if (request.categoriaId !== undefined && request.categoriaId !== gastoFijo.categoria?.id) {
        const categoriaExiste = await this.categoriaRepository.findOne({
          where: { id: request.categoriaId },
        });
        if (!categoriaExiste) {
          this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { categoriaId: request.categoriaId });
        }
        if (categoriaExiste.tipo !== TipoCategoriaEnum.EGRESO) {
          this.errorHandler.throwBadRequest(
            ERRORS.VALIDATION.INVALID_INPUT,
            { message: 'La categoría del gasto fijo debe ser de tipo EGRESO', categoriaId: request.categoriaId },
          );
        }
      }

      if (request.diaVencimiento !== undefined) {
        const diaVen = new Date(request.diaVencimiento);
        const dia = diaVen.getDate();
        if (dia < 1 || dia > 31) {
          this.errorHandler.throwBadRequest(
            ERRORS.VALIDATION.INVALID_INPUT,
            { message: 'El día de vencimiento debe estar entre 1 y 31', diaVencimiento: request.diaVencimiento },
          );
        }
      }

      if (request.nombre !== undefined && request.nombre.toLowerCase() !== gastoFijo.nombre.toLowerCase()) {
        const gastoFijoExistente = await this.gastoFijoRepository
          .createQueryBuilder('gastoFijo')
          .where('gastoFijo.usuario = :usuarioId', { usuarioId })
          .andWhere('LOWER(gastoFijo.nombre) = LOWER(:nombre)', { nombre: request.nombre })
          .andWhere('gastoFijo.id != :idActual', { idActual: id })
          .getOne();

        if (gastoFijoExistente) {
          this.errorHandler.throwBadRequest(
            ERRORS.VALIDATION.INVALID_INPUT,
            { message: 'Ya existe otro gasto fijo con ese nombre para este usuario', nombre: request.nombre },
          );
        }
      }

      const updateGastoFijo = await this.gastoFijoMapper.updateDTO2Entity(gastoFijo, request);
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

      const categoriaIds = [...new Set(request.gastosFijos.map((gf) => gf.categoriaId))];
      const categorias = await this.categoriaRepository.find({
        where: categoriaIds.map((id) => ({ id })),
      });

      if (categorias.length !== categoriaIds.length) {
        const categoriasEncontradas = new Set(categorias.map((c) => c.id));
        const categoriasNoEncontradas = categoriaIds.filter((id) => !categoriasEncontradas.has(id));
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Una o más categorías no fueron encontradas',
          },
          { categoriaIds: categoriasNoEncontradas },
        );
      }

      const nombresEnRequest = request.gastosFijos.map((gf) => gf.nombre.toLowerCase());
      const nombresUnicos = new Set(nombresEnRequest);
      if (nombresEnRequest.length !== nombresUnicos.size) {
        const nombresDuplicados = nombresEnRequest.filter(
          (nombre, index) => nombresEnRequest.indexOf(nombre) !== index,
        );
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          {
            message: 'No se pueden crear gastos fijos con nombres duplicados en la misma solicitud',
            nombresDuplicados: [...new Set(nombresDuplicados)],
          },
        );
      }

      const nombresParaValidar = request.gastosFijos.map((gf) => gf.nombre.toLowerCase());
      const gastosFijosExistentes = await this.gastoFijoRepository
        .createQueryBuilder('gastoFijo')
        .where('gastoFijo.usuario = :usuarioId', { usuarioId })
        .andWhere('LOWER(gastoFijo.nombre) IN (:...nombres)', { nombres: nombresParaValidar })
        .getMany();

      if (gastosFijosExistentes.length > 0) {
        const nombresExistentes = gastosFijosExistentes.map((gf) => gf.nombre);
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          {
            message: 'Uno o más gastos fijos ya existen con esos nombres para este usuario',
            nombresExistentes,
          },
        );
      }

      const nuevosGastosFijos = await Promise.all(
        request.gastosFijos.map(async (gastoFijoDto) => {
          const newGastoFijo = await this.gastoFijoMapper.createDTO2Entity(gastoFijoDto);
          newGastoFijo.usuario = usuario;
          return newGastoFijo;
        }),
      );

      const gastosFijosGuardados = await this.gastoFijoRepository.save(nuevosGastosFijos);

      for (const gastoFijoGuardado of gastosFijosGuardados) {
        await this.crearPagoGastoFijoParaMesActual(gastoFijoGuardado.id, usuarioId);
      }

      const ids = gastosFijosGuardados.map((gf) => gf.id);
      const gastosFijosCompletos = await this.gastoFijoRepository.find({
        where: ids.map((id) => ({ id })),
        relations: ['categoria', 'usuario'],
      });

      const dtos = await Promise.all(
        gastosFijosCompletos.map((gf) => this.gastoFijoMapper.entity2DTO(gf)),
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
   * Crea un PagoGastoFijo para el mes actual si no existe (sin depender de info inicial).
   */
  private async crearPagoGastoFijoParaMesActual(gastoFijoId: number, usuarioId: number): Promise<void> {
    try {
      const fechaActual = new Date();
      const anioActual = fechaActual.getFullYear();
      const mesActual = this.obtenerMesActual();

      const existente = await this.pagoGastoFijoRepository.findByGastoFijoAndMesAnio(
        gastoFijoId,
        anioActual,
        mesActual,
      );
      if (existente) return;

      const gastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: gastoFijoId },
        relations: ['usuario'],
      });
      if (!gastoFijo) return;

      const nuevoPago = new PagoGastoFijo();
      nuevoPago.gastoFijo = gastoFijo;
      nuevoPago.mes = mesActual;
      nuevoPago.anio = anioActual;
      nuevoPago.monto = Number(gastoFijo.montoEstimado ?? 0);
      nuevoPago.pagado = false;
      nuevoPago.usuario = gastoFijo.usuario;

      await this.pagoGastoFijoRepository.save(nuevoPago);
    } catch (error) {
      console.error('Error al crear pago de gasto fijo para el mes actual:', error);
    }
  }

  private checkBelongsToUser(gastoFijo: GastoFijo, usuarioId: number, accion: string): void {
    if (gastoFijo.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        `No tienes permiso para ${accion} este gasto fijo`,
      );
    }
  }
}

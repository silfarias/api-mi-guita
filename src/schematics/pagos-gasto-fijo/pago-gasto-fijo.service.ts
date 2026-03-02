import { Injectable, HttpException, BadRequestException } from '@nestjs/common';
import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { MesEnum } from 'src/common/enums/mes-enum';

import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { Movimiento } from 'src/schematics/movimiento/entities/movimiento.entity';
import { GastoFijoRepository } from 'src/schematics/gasto-fijo/repository/gasto-fijo.repository';
import { MovimientoService } from 'src/schematics/movimiento/movimiento.service';

import { PagoGastoFijo } from './entities/pago-gasto-fijo.entity';
import { PagoGastoFijoRepository } from './repository/pago-gasto-fijo.repository';
import { PagoGastoFijoMapper } from './mapper/pago-gasto-fijo.mapper';
import { PagoGastoFijoDTO, PagosGastoFijoDTO } from './dto/pago-gasto-fijo.dto';
import { CreatePagoGastoFijoRequestDto } from './dto/create-pago-gasto-fijo-request.dto';
import { UpdatePagoGastoFijoRequestDto } from './dto/update-pago-gasto-fijo-request.dto';
import { SearchPagoGastoFijoRequestDto } from './dto/search-pago-gasto-fijo-request.dto';

const RELATIONS_FIND_ONE = [
  'gastoFijo',
  'gastoFijo.categoria',
  'gastoFijo.usuario',
  'movimimiento',
  'usuario',
] as const;

@Injectable()
export class PagoGastoFijoService {
  constructor(
    private readonly pagoGastoFijoMapper: PagoGastoFijoMapper,
    private readonly pagoGastoFijoRepository: PagoGastoFijoRepository,
    private readonly gastoFijoRepository: GastoFijoRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly movimientoService: MovimientoService,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<PagoGastoFijoDTO> {
    try {
      const pago = await this.getEntityService.findById(PagoGastoFijo, id, [...RELATIONS_FIND_ONE]);
      this.checkPagoBelongsToUser(pago, usuarioId);
      return this.pagoGastoFijoMapper.entity2DTO(pago);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchPagoGastoFijoRequestDto, usuarioId: number): Promise<PageDto<PagoGastoFijoDTO>> {
    const page = await this.pagoGastoFijoRepository.search(request, usuarioId);
    return this.pagoGastoFijoMapper.page2Dto(request, page);
  }

  async getPagosPorMes(anio: number, mes: MesEnum, usuarioId: number): Promise<PagosGastoFijoDTO> {
    const [gastosFijosActivos, gastosFijosPagos] = await Promise.all([
      this.gastoFijoRepository.getGastosFijosActivos(usuarioId),
      this.pagoGastoFijoRepository.findByMesAnioAndUsuario(anio, mes, usuarioId),
    ]);
    return this.pagoGastoFijoMapper.toPagosGastoFijoDTO(anio, mes, gastosFijosActivos, gastosFijosPagos);
  }

  async create(request: CreatePagoGastoFijoRequestDto, usuarioId: number): Promise<PagoGastoFijoDTO> {
    try {
      const gastoFijoEntity = await this.getEntityService.findById(GastoFijo, request.gastoFijoId, [
        'usuario',
        'categoria',
      ]);
      if (gastoFijoEntity.usuario.id !== usuarioId) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          'No tienes permiso para crear pagos de este gasto fijo',
        );
      }

      const existente = await this.pagoGastoFijoRepository.findByGastoFijoAndMesAnio(
        request.gastoFijoId,
        request.anio,
        request.mes,
      );
      if (existente) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          'Ya existe un registro de pago para este gasto fijo en este mes',
        );
      }

      const monto = request.monto ?? Number(gastoFijoEntity.montoEstimado ?? 0);
      const newPago = await this.pagoGastoFijoMapper.createDTO2Entity(request, gastoFijoEntity, usuarioId);
      const saved = await this.pagoGastoFijoRepository.save(newPago);

      const movimientoDto = await this.movimientoService.create(
        {
          cuentaId: request.cuentaId,
          fecha: new Date(),
          tipoMovimiento: TipoMovimientoEnum.EGRESO,
          descripcion: `Pago de gasto fijo ${gastoFijoEntity.nombre}`,
          categoriaId: gastoFijoEntity.categoria.id,
          monto,
        },
        usuarioId,
      );

      saved.movimimiento = Movimiento.fromId(movimientoDto.id);
      await this.pagoGastoFijoRepository.save(saved);

      const withRelations = await this.getEntityService.findById(PagoGastoFijo, saved.id, [
        ...RELATIONS_FIND_ONE,
      ]);
      return this.pagoGastoFijoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdatePagoGastoFijoRequestDto, usuarioId: number): Promise<PagoGastoFijoDTO> {
    try {
      const pago = await this.getEntityService.findById(PagoGastoFijo, id, [
        'gastoFijo',
        'gastoFijo.usuario',
        'gastoFijo.categoria',
        'gastoFijo.montoEstimado',
        'movimimiento',
        'usuario',
      ]);
      this.checkPagoBelongsToUser(pago, usuarioId);

      if (request.pagado === true && request.monto === undefined) {
        const montoEstimado = Number(pago.gastoFijo?.montoEstimado ?? 0);
        if (montoEstimado > 0 && pago.monto === 0) {
          request.monto = montoEstimado;
        } else if (pago.monto === 0) {
          this.errorHandler.throwBadRequest(
            ERRORS.VALIDATION.INVALID_INPUT,
            'Debe proporcionar el monto pagado antes de marcar como pagado',
          );
        }
      }

      const updated = await this.pagoGastoFijoMapper.updateDTO2Entity(pago, request);
      await this.pagoGastoFijoRepository.save(updated);

      const withRelations = await this.getEntityService.findById(PagoGastoFijo, id, [
        ...RELATIONS_FIND_ONE,
      ]);
      return this.pagoGastoFijoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const pago = await this.getEntityService.findById(PagoGastoFijo, id, [
        'gastoFijo',
        'gastoFijo.usuario',
        'usuario',
      ]);
      this.checkPagoBelongsToUser(pago, usuarioId);
      await this.pagoGastoFijoRepository.softRemove(pago);
      return 'Pago gasto fijo eliminado correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  private checkPagoBelongsToUser(pago: PagoGastoFijo, usuarioId: number): void {
    if (pago.gastoFijo?.usuario?.id !== usuarioId || pago.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'No tienes permiso para este pago de gasto fijo',
      );
    }
  }
}

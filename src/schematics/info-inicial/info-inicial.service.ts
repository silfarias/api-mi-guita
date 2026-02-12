import { Injectable, HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';

import { Usuario } from '../usuario/entities/usuario.entity';
import { MedioPago } from '../medio-pago/entities/medio-pago.entity';
import { MedioPagoMapper } from '../medio-pago/mappers/medio-pago.mapper';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { GastoFijoPagoService } from '../gasto-fijo/gasto-fijo-pago.service';
import { ResumenPagoGastoFijoService } from '../gasto-fijo/resumen-pago-gasto-fijo.service';

import { InfoInicial } from './entities/info-inicial.entity';
import { InfoInicialMedioPago } from './entities/info-inicial-mediopago.entity';
import { InfoInicialMapper } from './mappers/info-inicial.mapper';
import { InfoInicialRepository } from './repository/info-inicial.repository';
import { InfoInicialMedioPagoRepository } from './repository/info-inicial-mediopago.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';
import { InfoInicialDTO } from './dto/info-inicial.dto';
import { CreateInfoInicialRequestDto } from './dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from './dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from './dto/search-info-inicial-request.dto';
import { SaldosActualesDTO, SaldoActualDTO } from './dto/saldos-actuales.dto';

const RELATIONS = ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'] as const;

@Injectable()
export class InfoInicialService {
  constructor(
    private readonly infoInicialMapper: InfoInicialMapper,
    private readonly infoInicialRepository: InfoInicialRepository,
    private readonly infoInicialMedioPagoRepository: InfoInicialMedioPagoRepository,
    private readonly medioPagoRepository: MedioPagoRepository,
    private readonly movimientoRepository: MovimientoRepository,
    private readonly medioPagoMapper: MedioPagoMapper,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly gastoFijoPagoService: GastoFijoPagoService,
    private readonly resumenPagoGastoFijoService: ResumenPagoGastoFijoService,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<InfoInicialDTO> {
    try {
      const infoInicial = await this.getEntityService.findById(InfoInicial, id, [...RELATIONS]);
      return this.infoInicialMapper.entity2DTO(infoInicial);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchInfoInicialRequestDto): Promise<PageDto<InfoInicialDTO>> {
    try {
      const page = await this.infoInicialRepository.search(request);
      return this.infoInicialMapper.page2Dto(request, page);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async findByUsuarioAutenticado(usuarioId: number): Promise<PageDto<InfoInicialDTO>> {
    const request = new SearchInfoInicialRequestDto();
    request.usuarioId = usuarioId;
    return this.search(request);
  }

  async create(request: CreateInfoInicialRequestDto, usuarioId: number): Promise<InfoInicialDTO> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);
      await this.validateNoDuplicateInfoInicial(usuarioId, request.anio, request.mes);

      const medioPagoIds = request.mediosPago.map((mp) => mp.medioPagoId);
      const mediosPagoExistentes = await this.validateAndGetMediosPago(medioPagoIds);
      this.validateMediosPagoUnicos(medioPagoIds);

      const newInfoInicial = this.infoInicialMapper.createDTO2Entity(request, usuario);

      const infoInicialSaved = await this.dataSource.transaction(async (manager) => {
        const infoInicial = await manager.getRepository(InfoInicial).save(newInfoInicial);

        const infoInicialMedioPagos: InfoInicialMedioPago[] = request.mediosPago.map((mp) => {
          const infoMedioPago = new InfoInicialMedioPago();
          infoMedioPago.infoInicial = infoInicial;
          infoMedioPago.medioPago = mediosPagoExistentes.find((m) => m.id === mp.medioPagoId)!;
          infoMedioPago.monto = mp.monto;
          return infoMedioPago;
        });
        await manager.getRepository(InfoInicialMedioPago).save(infoInicialMedioPagos);

        await this.gastoFijoPagoService.crearGastosFijosPagosAutomaticos(infoInicial, usuarioId, manager);
        await this.resumenPagoGastoFijoService.crearOInicializarResumen(infoInicial.id, usuarioId, manager);

        return infoInicial;
      });

      const withRelations = await this.getEntityService.findById(InfoInicial, infoInicialSaved.id, [...RELATIONS]);
      return this.infoInicialMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdateInfoInicialRequestDto, usuarioId: number): Promise<InfoInicialDTO> {
    try {
      const infoInicial = await this.getEntityService.findById(InfoInicial, id, [...RELATIONS]);
      this.checkBelongsToUser(infoInicial, usuarioId, 'modificar');

      if (request.anio !== undefined || request.mes !== undefined) {
        const newAnio = request.anio ?? infoInicial.anio;
        const newMes = request.mes ?? infoInicial.mes;
        await this.validateNoDuplicateInfoInicial(usuarioId, newAnio, newMes, id);
      }

      const updated = this.infoInicialMapper.updateDTO2Entity(infoInicial, request);
      await this.infoInicialRepository.save(updated);

      if (request.mediosPago && request.mediosPago.length > 0) {
        const medioPagoIds = request.mediosPago.map((mp) => mp.medioPagoId);
        const mediosPagoExistentes = await this.validateAndGetMediosPago(medioPagoIds);
        this.validateMediosPagoUnicos(medioPagoIds);

        if (infoInicial.infoInicialMedioPagos?.length) {
          await this.infoInicialMedioPagoRepository.softRemove(infoInicial.infoInicialMedioPagos);
        }

        const infoInicialMedioPagos: InfoInicialMedioPago[] = request.mediosPago.map((mp) => {
          const infoMedioPago = new InfoInicialMedioPago();
          infoMedioPago.infoInicial = updated;
          infoMedioPago.medioPago = mediosPagoExistentes.find((m) => m.id === mp.medioPagoId)!;
          infoMedioPago.monto = mp.monto;
          return infoMedioPago;
        });
        await this.infoInicialMedioPagoRepository.save(infoInicialMedioPagos);
      }

      const withRelations = await this.getEntityService.findById(InfoInicial, id, [...RELATIONS]);
      return this.infoInicialMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const infoInicial = await this.getEntityService.findById(InfoInicial, id, ['usuario']);
      this.checkBelongsToUser(infoInicial, usuarioId, 'eliminar');
      await this.infoInicialRepository.softRemove(infoInicial);
      return 'Información inicial eliminada correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async findByUsuarioAndMes(usuarioId: number, anio: number, mes: string): Promise<InfoInicialDTO | null> {
    const infoInicial = await this.infoInicialRepository.findByUsuarioAndMes(usuarioId, anio, mes);
    if (!infoInicial) return null;
    return this.infoInicialMapper.entity2DTO(infoInicial);
  }

  async calcularSaldosActuales(id: number, usuarioId: number): Promise<SaldosActualesDTO> {
    try {
      const infoInicial = await this.getEntityService.findById(InfoInicial, id, [...RELATIONS]);
      this.checkBelongsToUser(infoInicial, usuarioId, 'ver los saldos de');

      const movimientos = await this.movimientoRepository.find({
        where: { infoInicial: { id: infoInicial.id } },
        relations: ['medioPago'],
      });

      const saldosMap = new Map<number, SaldoActualDTO>();

      if (infoInicial.infoInicialMedioPagos?.length) {
        for (const infoMedioPago of infoInicial.infoInicialMedioPagos) {
          const medioPagoDTO = await this.medioPagoMapper.entity2DTO(infoMedioPago.medioPago);
          saldosMap.set(infoMedioPago.medioPago.id, {
            medioPago: medioPagoDTO,
            saldoInicial: Number(infoMedioPago.monto),
            totalIngresos: 0,
            totalEgresos: 0,
            saldoActual: Number(infoMedioPago.monto),
          });
        }
      }

      for (const movimiento of movimientos) {
        if (movimiento.medioPago?.id) {
          const medioPagoId = movimiento.medioPago.id;
          if (!saldosMap.has(medioPagoId)) {
            const medioPagoDTO = await this.medioPagoMapper.entity2DTO(movimiento.medioPago);
            saldosMap.set(medioPagoId, {
              medioPago: medioPagoDTO,
              saldoInicial: 0,
              totalIngresos: 0,
              totalEgresos: 0,
              saldoActual: 0,
            });
          }
          const saldo = saldosMap.get(medioPagoId)!;
          const monto = Number(movimiento.monto);
          if (movimiento.tipoMovimiento === TipoMovimientoEnum.INGRESO) {
            saldo.totalIngresos += monto;
          } else {
            saldo.totalEgresos += monto;
          }
        }
      }

      for (const saldo of saldosMap.values()) {
        saldo.saldoActual = saldo.saldoInicial + saldo.totalIngresos - saldo.totalEgresos;
      }

      const saldosPorMedioPago = Array.from(saldosMap.values());
      const balanceTotal = saldosPorMedioPago.reduce((sum, s) => sum + s.saldoActual, 0);
      return { saldosPorMedioPago, balanceTotal };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  /** Alias para compatibilidad */
  findOne(id: number): Promise<InfoInicialDTO> {
    return this.findById(id);
  }

  private async validateNoDuplicateInfoInicial(
    usuarioId: number,
    anio: number,
    mes: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.infoInicialRepository.findByUsuarioAndMes(usuarioId, anio, mes);
    if (existing && existing.id !== excludeId) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, {
        message: 'Ya existe información inicial para este usuario, año y mes',
        usuarioId,
        anio,
        mes,
      });
    }
  }

  private async validateAndGetMediosPago(medioPagoIds: number[]): Promise<MedioPago[]> {
    const mediosPago = await this.medioPagoRepository
      .createQueryBuilder('medioPago')
      .where('medioPago.id IN (:...ids)', { ids: medioPagoIds })
      .getMany();
    if (mediosPago.length !== medioPagoIds.length) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, {
        message: 'Uno o más medios de pago no existen',
        medioPagoIds,
      });
    }
    return mediosPago;
  }

  private validateMediosPagoUnicos(medioPagoIds: number[]): void {
    if (new Set(medioPagoIds).size !== medioPagoIds.length) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No se pueden repetir medios de pago');
    }
  }

  private checkBelongsToUser(infoInicial: InfoInicial, usuarioId: number, accion: string): void {
    if (infoInicial.usuario.id !== usuarioId) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, `No tienes permiso para ${accion} esta información inicial`);
    }
  }
}

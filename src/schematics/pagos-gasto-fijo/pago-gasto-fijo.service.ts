import { Injectable, HttpException, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';

import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { GastoFijoRepository } from 'src/schematics/gasto-fijo/repository/gasto-fijo.repository';
import { ResumenPagoGastoFijoService } from 'src/schematics/resumen-gasto-fijo/resumen-pago-gasto-fijo.service';
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
  'gastoFijo.medioPago',
  'gastoFijo.usuario',
  'infoInicial',
  'infoInicial.usuario',
] as const;

@Injectable()
export class PagoGastoFijoService {
  constructor(
    private readonly pagoGastoFijoMapper: PagoGastoFijoMapper,
    private readonly pagoGastoFijoRepository: PagoGastoFijoRepository,
    private readonly gastoFijoRepository: GastoFijoRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => ResumenPagoGastoFijoService))
    private readonly resumenPagoGastoFijoService: ResumenPagoGastoFijoService,
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

  async getPagosPorInfoInicial(infoInicialId: number, usuarioId: number): Promise<PagosGastoFijoDTO> {
    const infoInicial = await this.getEntityService.findById(InfoInicial, infoInicialId, [
      'usuario',
      'infoInicialMedioPagos',
      'infoInicialMedioPagos.medioPago',
    ]);
    if (infoInicial.usuario.id !== usuarioId) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No tienes permiso para acceder a esta información inicial');
    }
    const [gastosFijosActivos, gastosFijosPagos] = await Promise.all([
      this.gastoFijoRepository.getGastosFijosActivos(usuarioId),
      this.pagoGastoFijoRepository.findByInfoInicialIdAndUsuario(infoInicialId, usuarioId),
    ]);
    return this.pagoGastoFijoMapper.toPagosGastoFijoDTO(infoInicial, gastosFijosActivos, gastosFijosPagos);
  }

  async create(request: CreatePagoGastoFijoRequestDto, usuarioId: number): Promise<PagoGastoFijoDTO> {
    try {
      const gastoFijoEntity = await this.getEntityService.findById(GastoFijo, request.gastoFijoId, ['usuario', 'categoria']);
      if (gastoFijoEntity.usuario.id !== usuarioId) {
        this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No tienes permiso para crear pagos de este gasto fijo');
      }

      const infoInicial = await this.getEntityService.findById(InfoInicial, request.infoInicialId, ['usuario']);
      if (infoInicial.usuario.id !== usuarioId) {
        this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No tienes permiso para crear pagos en esta información inicial');
      }

      const existente = await this.pagoGastoFijoRepository.findByGastoFijoAndInfoInicial(
        request.gastoFijoId,
        request.infoInicialId,
      );
      if (existente) {
        this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'Ya existe un registro de pago para este gasto fijo en este mes');
      }

      const newPago = this.pagoGastoFijoMapper.createDTO2Entity(request, gastoFijoEntity, infoInicial);
      const saved = await this.pagoGastoFijoRepository.save(newPago);

      await this.movimientoService.create(
        {
          fecha: new Date(),
          tipoMovimiento: TipoMovimientoEnum.EGRESO,
          descripcion: `Pago de gasto fijo ${gastoFijoEntity.nombre}`,
          categoriaId: gastoFijoEntity.categoria.id,
          medioPagoId: request.medioPagoId,
          monto: saved.montoPago,
          infoInicialId: infoInicial.id,
        },
        usuarioId,
      );

      await this.resumenPagoGastoFijoService.recalcularResumen(infoInicial.id);

      const withRelations = await this.getEntityService.findById(PagoGastoFijo, saved.id, [...RELATIONS_FIND_ONE]);
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
        'gastoFijo.montoFijo',
        'infoInicial',
        'infoInicial.usuario',
      ]);
      this.checkPagoBelongsToUser(pago, usuarioId);

      if (request.pagado === true && request.montoPago === undefined) {
        const montoFijo = pago.gastoFijo.montoFijo != null ? Number(pago.gastoFijo.montoFijo) : 0;
        if (montoFijo > 0 && pago.montoPago === 0) {
          request.montoPago = montoFijo;
        } else if (pago.montoPago === 0) {
          this.errorHandler.throwBadRequest(
            ERRORS.VALIDATION.INVALID_INPUT,
            'Debe proporcionar el monto pagado antes de marcar como pagado',
          );
        }
      }

      const updated = this.pagoGastoFijoMapper.updateDTO2Entity(pago, request);
      await this.pagoGastoFijoRepository.save(updated);
      await this.resumenPagoGastoFijoService.recalcularResumen(pago.infoInicial.id);

      const withRelations = await this.getEntityService.findById(PagoGastoFijo, id, [...RELATIONS_FIND_ONE]);
      return this.pagoGastoFijoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const pago = await this.getEntityService.findById(PagoGastoFijo, id, ['gastoFijo', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario']);
      this.checkPagoBelongsToUser(pago, usuarioId);
      await this.pagoGastoFijoRepository.softRemove(pago);
      return 'Pago gasto fijo eliminado correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async crearGastosFijosPagosAutomaticos(
    infoInicial: InfoInicial,
    usuarioId: number,
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const gastosFijosActivos = await this.gastoFijoRepository.getGastosFijosActivos(usuarioId);
      if (gastosFijosActivos.length === 0) return;

      const idsConPago = await this.pagoGastoFijoRepository.getGastosFijosIdsConPago(infoInicial.id);
      const setIdsConPago = new Set(idsConPago);

      const gastosFijosPagos: PagoGastoFijo[] = gastosFijosActivos
        .filter((gf) => !setIdsConPago.has(gf.id))
        .map((gastoFijo) => {
          const pago = new PagoGastoFijo();
          pago.gastoFijo = gastoFijo;
          pago.infoInicial = infoInicial;
          pago.medioPago = null;
          pago.montoPago = 0;
          pago.pagado = false;
          return pago;
        });

      if (gastosFijosPagos.length > 0) {
        if (manager) {
          await manager.getRepository(PagoGastoFijo).save(gastosFijosPagos);
        } else {
          await this.pagoGastoFijoRepository.save(gastosFijosPagos);
        }
      }
    } catch (error) {
      console.error('Error al crear pagos automáticos de gasto fijo:', error);
    }
  }

  private checkPagoBelongsToUser(pago: PagoGastoFijo, usuarioId: number): void {
    if (pago.gastoFijo?.usuario?.id !== usuarioId || pago.infoInicial?.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No tienes permiso para este pago de gasto fijo');
    }
  }
}

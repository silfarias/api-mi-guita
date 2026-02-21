import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';

import { InfoInicial } from '../info-inicial/entities/info-inicial.entity';
import { PagoGastoFijo } from '../pagos-gasto-fijo/entities/pago-gasto-fijo.entity';
import { ResumenPagoGastoFijo } from './entities/resumen-pago-gasto-fijo.entity';
import { ResumenPagoGastoFijoDTO } from './dto/resumen-pago-gasto-fijo.dto';
import { ResumenPagoGastoFijoRepository } from './repository/resumen-pago-gasto-fijo.repository';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { PagoGastoFijoRepository } from '../pagos-gasto-fijo/repository/pago-gasto-fijo.repository';
import { ResumenPagoGastoFijoMapper } from './mapper/resumen-pago-gasto-fijo.mapper';

@Injectable()
export class ResumenPagoGastoFijoService {
  constructor(
    private readonly resumenRepository: ResumenPagoGastoFijoRepository,
    private readonly resumenMapper: ResumenPagoGastoFijoMapper,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => InfoInicialRepository))
    private readonly infoInicialRepository: InfoInicialRepository,
    @Inject(forwardRef(() => PagoGastoFijoRepository))
    private readonly pagoGastoFijoRepository: PagoGastoFijoRepository,
  ) {}

  /**
   * Crea o inicializa un resumen para una InfoInicial.
   * Inicia todos los campos en 0; recalcularResumen los actualiza según gastos fijos (montoTotalDefinido
   * desde gastoFijo.montoFijo) y pagos realizados (montoPagado desde pago.montoPago de los pagados).
   * Si se recibe manager (transacción), todas las lecturas/escrituras usan ese manager.
   */
  async crearOInicializarResumen(
    infoInicialId: number,
    usuarioId: number,
    manager?: EntityManager,
  ): Promise<ResumenPagoGastoFijo> {
    const repoInfo = manager ? manager.getRepository(InfoInicial) : this.infoInicialRepository;
    const repoResumen = manager ? manager.getRepository(ResumenPagoGastoFijo) : this.resumenRepository;

    const infoInicial = await repoInfo.findOne({
      where: { id: infoInicialId },
      relations: ['usuario'],
    });

    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Información inicial no encontrada',
        details: JSON.stringify({ infoInicialId }),
      });
    }

    const findResumen = manager
      ? () =>
          repoResumen.findOne({
            where: { infoInicial: { id: infoInicialId } },
            relations: ['infoInicial', 'usuario'],
          })
      : () => this.resumenRepository.findByInfoInicialId(infoInicialId);

    let resumen = await findResumen();

    if (!resumen) {
      resumen = new ResumenPagoGastoFijo();
      resumen.infoInicial = infoInicial;
      resumen.usuario = infoInicial.usuario;
      resumen.montoTotalDefinido = 0;
      resumen.montoPagado = 0;
      resumen.cantidadGastosTotales = 0;
      resumen.cantidadGastosPagados = 0;
      await repoResumen.save(resumen);
    }

    await this.recalcularResumen(infoInicialId, manager);

    const resumenFinal = await findResumen();
    return resumenFinal as ResumenPagoGastoFijo;
  }

  /**
   * Recalcula el resumen basado en los gastos fijos pagos de la InfoInicial.
   *
   * - montoTotalDefinido: suma de gastoFijo.montoFijo solo de los gastos que tienen monto definido
   *   (luz, agua, impuestos pueden no tener monto fijo y no entran en este total).
   * - montoPagado: suma de lo que el usuario ya pagó (pago.montoPago en registros marcados como pagados).
   *   En gastos sin monto fijo, al pagar se envía el monto abonado; en gastos con monto fijo se usa ese monto.
   * - No existe un "total a pagar este mes" único porque no todos los gastos tienen monto definido.
   */
  async recalcularResumen(infoInicialId: number, manager?: EntityManager): Promise<void> {
    const repoResumen = manager ? manager.getRepository(ResumenPagoGastoFijo) : this.resumenRepository;
    const repoPago = manager ? manager.getRepository(PagoGastoFijo) : this.pagoGastoFijoRepository;

    const resumen = manager
      ? await repoResumen.findOne({
          where: { infoInicial: { id: infoInicialId } },
          relations: ['infoInicial', 'usuario'],
        })
      : await this.resumenRepository.findByInfoInicialId(infoInicialId);

    if (!resumen) return;

    const gastosFijosPagos = await repoPago.find({
      where: { infoInicial: { id: infoInicialId } },
      relations: ['gastoFijo'],
    });

    let montoTotalDefinido = 0;
    let montoPagado = 0;
    let cantidadGastosPagados = 0;

    gastosFijosPagos.forEach((pago) => {
      // Solo los gastos fijos con monto definido (ej. alquiler, Netflix) suman al total definido
      const montoFijo = pago.gastoFijo?.montoFijo;
      if (montoFijo != null) {
        montoTotalDefinido += Number(montoFijo);
      }
      // Lo que el usuario ya pagó (al marcar como pagado puede enviar el monto en gastos variables)
      if (pago.pagado) {
        montoPagado += Number(pago.montoPago ?? 0);
        cantidadGastosPagados++;
      }
    });

    resumen.montoTotalDefinido = montoTotalDefinido;
    resumen.montoPagado = montoPagado;
    resumen.cantidadGastosTotales = gastosFijosPagos.length;
    resumen.cantidadGastosPagados = cantidadGastosPagados;

    await repoResumen.save(resumen);
  }

  async findByInfoInicialId(infoInicialId: number, usuarioId: number): Promise<ResumenPagoGastoFijoDTO> {
    const resumen = await this.resumenRepository.findByUsuarioAndInfoInicial(usuarioId, infoInicialId);
    if (!resumen) {
      this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, {
        message: 'Resumen de pago de gastos fijos no encontrado',
        infoInicialId,
      });
    }
    return this.resumenMapper.entity2DTO(resumen);
  }
}
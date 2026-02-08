import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ResumenPagoGastoFijo } from './entities/resumen-pago-gasto-fijo.entity';
import { ResumenPagoGastoFijoDTO } from './dto/resumen-pago-gasto-fijo.dto';
import { ResumenPagoGastoFijoRepository } from './repository/resumen-pago-gasto-fijo.repository';
import { ResumenPagoGastoFijoMapper } from './mappers/resumen-pago-gasto-fijo.mapper';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { ERRORS } from 'src/common/errors/errors-codes';
import { InfoInicial } from '../info-inicial/entities/info-inicial.entity';
import { GastoFijoPago } from './entities/gasto-fijo-pago.entity';

@Injectable()
export class ResumenPagoGastoFijoService {
  constructor(
    private resumenRepository: ResumenPagoGastoFijoRepository,
    private resumenMapper: ResumenPagoGastoFijoMapper,
    @Inject(forwardRef(() => InfoInicialRepository))
    private infoInicialRepository: InfoInicialRepository,
    @Inject(forwardRef(() => GastoFijoPagoRepository))
    private gastoFijoPagoRepository: GastoFijoPagoRepository,
  ) {}

  /**
   * Crea o inicializa un resumen para una InfoInicial.
   * Si se recibe manager (transacción), todas las lecturas/escrituras usan ese manager.
   */
  async crearOInicializarResumen(
    infoInicialId: number,
    usuarioId: number,
    manager?: EntityManager,
  ): Promise<ResumenPagoGastoFijo> {
    const repoInfo = manager
      ? manager.getRepository(InfoInicial)
      : this.infoInicialRepository;
    const repoResumen = manager
      ? manager.getRepository(ResumenPagoGastoFijo)
      : this.resumenRepository;

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
      resumen.montoTotal = 0;
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
   * - montoTotal: suma de todos los montoPago (esperado por línea; al inicio son 0, luego el usuario puede setear montoFijo o manual).
   * - montoPagado: suma de montoPago solo de los registros marcados como pagado.
   * - cantidadGastosTotales: cantidad de GastoFijoPago para este mes (solo gastos fijos activos).
   * - cantidadGastosPagados: cantidad de pagos con pagado = true.
   */
  async recalcularResumen(infoInicialId: number, manager?: EntityManager): Promise<void> {
    const repoResumen = manager
      ? manager.getRepository(ResumenPagoGastoFijo)
      : this.resumenRepository;
    const repoPago = manager
      ? manager.getRepository(GastoFijoPago)
      : this.gastoFijoPagoRepository;

    const resumen = manager
      ? await repoResumen.findOne({
          where: { infoInicial: { id: infoInicialId } },
          relations: ['infoInicial', 'usuario'],
        })
      : await this.resumenRepository.findByInfoInicialId(infoInicialId);

    if (!resumen) {
      return;
    }

    const gastosFijosPagos = await repoPago.find({
      where: { infoInicial: { id: infoInicialId } },
      relations: ['gastoFijo'],
    });

    let montoTotal = 0;
    let montoPagado = 0;
    let cantidadGastosPagados = 0;

    gastosFijosPagos.forEach((pago) => {
      montoTotal += Number(pago.montoPago ?? 0);
      if (pago.pagado) {
        montoPagado += Number(pago.montoPago ?? 0);
        cantidadGastosPagados++;
      }
    });

    resumen.montoTotal = montoTotal;
    resumen.montoPagado = montoPagado;
    resumen.cantidadGastosTotales = gastosFijosPagos.length;
    resumen.cantidadGastosPagados = cantidadGastosPagados;

    await repoResumen.save(resumen);
  }

  /**
   * Obtiene el resumen por InfoInicialId
   */
  async findByInfoInicialId(infoInicialId: number, usuarioId: number): Promise<ResumenPagoGastoFijoDTO> {
    const resumen = await this.resumenRepository.findByUsuarioAndInfoInicial(usuarioId, infoInicialId);

    if (!resumen) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Resumen de pago de gastos fijos no encontrado',
        details: JSON.stringify({ infoInicialId }),
      });
    }

    return await this.resumenMapper.entity2DTO(resumen);
  }
}

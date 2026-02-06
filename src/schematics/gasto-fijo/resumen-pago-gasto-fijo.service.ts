import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ResumenPagoGastoFijo } from './entities/resumen-pago-gasto-fijo.entity';
import { ResumenPagoGastoFijoDTO } from './dto/resumen-pago-gasto-fijo.dto';
import { ResumenPagoGastoFijoRepository } from './repository/resumen-pago-gasto-fijo.repository';
import { ResumenPagoGastoFijoMapper } from './mappers/resumen-pago-gasto-fijo.mapper';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { ERRORS } from 'src/common/errors/errors-codes';

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
   * Crea o inicializa un resumen para una InfoInicial
   */
  async crearOInicializarResumen(infoInicialId: number, usuarioId: number): Promise<ResumenPagoGastoFijo> {
    const infoInicial = await this.infoInicialRepository.findOne({
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

    // Verificar si ya existe un resumen
    let resumen = await this.resumenRepository.findByInfoInicialId(infoInicialId);

    if (!resumen) {
      // Crear nuevo resumen
      resumen = new ResumenPagoGastoFijo();
      resumen.infoInicial = infoInicial;
      resumen.usuario = infoInicial.usuario;
      resumen.montoTotal = 0;
      resumen.montoPagado = 0;
      resumen.cantidadGastosTotales = 0;
      resumen.cantidadGastosPagados = 0;
      await this.resumenRepository.save(resumen);
    }

    // Recalcular el resumen basado en los gastos fijos pagos actuales
    await this.recalcularResumen(infoInicialId);

    return await this.resumenRepository.findByInfoInicialId(infoInicialId) as ResumenPagoGastoFijo;
  }

  /**
   * Recalcula el resumen basado en los gastos fijos pagos de la InfoInicial
   */
  async recalcularResumen(infoInicialId: number): Promise<void> {
    const resumen = await this.resumenRepository.findByInfoInicialId(infoInicialId);

    if (!resumen) {
      return; // Si no existe resumen, no hay nada que recalcular
    }

    // Obtener todos los gastos fijos pagos de esta InfoInicial
    const gastosFijosPagos = await this.gastoFijoPagoRepository.find({
      where: { infoInicial: { id: infoInicialId } },
      relations: ['gastoFijo'],
    });

    // Calcular totales
    let montoTotal = 0;
    let montoPagado = 0;
    let cantidadGastosPagados = 0;

    gastosFijosPagos.forEach(pago => {
      // El monto total se suma siempre (usando montoPago que puede venir de montoFijo o ser establecido manualmente)
      montoTotal += Number(pago.montoPago || 0);
      
      // El monto pagado solo se suma si está marcado como pagado
      if (pago.pagado) {
        montoPagado += Number(pago.montoPago || 0);
        cantidadGastosPagados++;
      }
    });

    // Actualizar el resumen
    resumen.montoTotal = montoTotal;
    resumen.montoPagado = montoPagado;
    resumen.cantidadGastosTotales = gastosFijosPagos.length;
    resumen.cantidadGastosPagados = cantidadGastosPagados;

    await this.resumenRepository.save(resumen);
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

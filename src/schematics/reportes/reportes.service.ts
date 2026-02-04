import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReporteMensualRequestDto } from './dto/reporte-mensual-request.dto';
import { ReporteMensualDTO, SaldoMedioPagoDTO, ResumenCategoriaDTO, ResumenMedioPagoDTO, ComparacionMesAnteriorDTO } from './dto/reporte-mensual.dto';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { MesEnum } from 'src/common/enums/mes-enum';
import { MedioPagoMapper } from '../medio-pago/mappers/medio-pago.mapper';
import { CategoriaMapper } from '../categoria/mappers/categoria.mapper';

@Injectable()
export class ReportesService {
  constructor(
    private infoInicialRepository: InfoInicialRepository,
    private movimientoRepository: MovimientoRepository,
    private medioPagoMapper: MedioPagoMapper,
    private categoriaMapper: CategoriaMapper,
  ) {}

  async generarReporteMensual(request: ReporteMensualRequestDto, usuarioId: number): Promise<ReporteMensualDTO> {
    // Obtener la información inicial del mes solicitado
    const infoInicial = await this.infoInicialRepository.findByUsuarioAndMes(
      usuarioId,
      request.anio,
      request.mes,
    );

    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'No se encontró información inicial para este mes',
        details: JSON.stringify({ usuarioId, anio: request.anio, mes: request.mes }),
      });
    }

    // Obtener todos los movimientos del mes (sin paginación)
    const movimientos = await this.movimientoRepository.find({
      where: { infoInicial: { id: infoInicial.id } },
      relations: ['categoria', 'medioPago'],
    });

    // Calcular totales
    const totalIngresos = movimientos
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.INGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totalEgresos = movimientos
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.EGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const balance = totalIngresos - totalEgresos;

    // Calcular saldos por medio de pago
    const saldosPorMedioPago = await this.calcularSaldosPorMedioPago(
      infoInicial,
      movimientos,
    );

    // Calcular balance total
    const balanceTotal = saldosPorMedioPago.reduce((sum, saldo) => sum + saldo.saldoActual, 0);

    // Calcular resumen por categoría
    const resumenPorCategoria = await this.calcularResumenPorCategoria(movimientos, totalEgresos);

    // Top 5 categorías
    const top5Categorias = [...resumenPorCategoria]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Calcular resumen por medio de pago
    const resumenPorMedioPago = await this.calcularResumenPorMedioPago(movimientos);

    // Comparación con mes anterior
    const comparacionMesAnterior = await this.calcularComparacionMesAnterior(
      usuarioId,
      request.anio,
      request.mes,
      totalIngresos,
      totalEgresos,
      balance,
    );

    // Construir el DTO
    const reporte: ReporteMensualDTO = {
      anio: request.anio,
      mes: request.mes,
      totalIngresos,
      totalEgresos,
      balance,
      saldosPorMedioPago,
      balanceTotal,
      resumenPorCategoria,
      top5Categorias,
      resumenPorMedioPago,
      comparacionMesAnterior,
    };

    return reporte;
  }

  private async calcularSaldosPorMedioPago(
    infoInicial: any,
    movimientos: any[],
  ): Promise<SaldoMedioPagoDTO[]> {
    const saldosMap = new Map<number, SaldoMedioPagoDTO>();

    // Inicializar saldos con los montos iniciales
    if (infoInicial.infoInicialMedioPagos) {
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

    // Calcular movimientos por medio de pago
    for (const movimiento of movimientos) {
      if (movimiento.medioPago && movimiento.medioPago.id) {
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

    // Calcular saldos actuales
    for (const saldo of saldosMap.values()) {
      saldo.saldoActual = saldo.saldoInicial + saldo.totalIngresos - saldo.totalEgresos;
    }

    return Array.from(saldosMap.values());
  }

  private async calcularResumenPorCategoria(
    movimientos: any[],
    totalEgresos: number,
  ): Promise<ResumenCategoriaDTO[]> {
    const categoriaMap = new Map<number, { categoria: any; total: number; cantidad: number }>();

    // Solo contar egresos
    const egresos = movimientos.filter(m => m.tipoMovimiento === TipoMovimientoEnum.EGRESO);

    for (const movimiento of egresos) {
      if (movimiento.categoria && movimiento.categoria.id) {
        const categoriaId = movimiento.categoria.id;
        const monto = Number(movimiento.monto);

        if (!categoriaMap.has(categoriaId)) {
          categoriaMap.set(categoriaId, {
            categoria: movimiento.categoria,
            total: 0,
            cantidad: 0,
          });
        }

        const resumen = categoriaMap.get(categoriaId)!;
        resumen.total += monto;
        resumen.cantidad += 1;
      }
    }

    // Convertir a DTOs
    const resumenes: ResumenCategoriaDTO[] = await Promise.all(
      Array.from(categoriaMap.values()).map(async (resumen) => {
        const categoriaDTO = await this.categoriaMapper.entity2DTO(resumen.categoria);
        const porcentaje = totalEgresos > 0 ? (resumen.total / totalEgresos) * 100 : 0;

        return {
          categoria: categoriaDTO,
          total: resumen.total,
          porcentaje: Number(porcentaje.toFixed(2)),
          cantidadMovimientos: resumen.cantidad,
        };
      })
    );

    return resumenes.sort((a, b) => b.total - a.total);
  }

  private async calcularResumenPorMedioPago(movimientos: any[]): Promise<ResumenMedioPagoDTO[]> {
    const medioPagoMap = new Map<number, { medioPago: any; ingresos: number; egresos: number }>();

    for (const movimiento of movimientos) {
      if (movimiento.medioPago && movimiento.medioPago.id) {
        const medioPagoId = movimiento.medioPago.id;
        const monto = Number(movimiento.monto);

        if (!medioPagoMap.has(medioPagoId)) {
          medioPagoMap.set(medioPagoId, {
            medioPago: movimiento.medioPago,
            ingresos: 0,
            egresos: 0,
          });
        }

        const resumen = medioPagoMap.get(medioPagoId)!;
        if (movimiento.tipoMovimiento === TipoMovimientoEnum.INGRESO) {
          resumen.ingresos += monto;
        } else {
          resumen.egresos += monto;
        }
      }
    }

    const totalMovimientos = movimientos.length;

    // Convertir a DTOs
    const resumenes: ResumenMedioPagoDTO[] = await Promise.all(
      Array.from(medioPagoMap.values()).map(async (resumen) => {
        const medioPagoDTO = await this.medioPagoMapper.entity2DTO(resumen.medioPago);
        const totalMovido = resumen.ingresos + resumen.egresos;
        const porcentaje = totalMovimientos > 0 
          ? (movimientos.filter(m => m.medioPago?.id === resumen.medioPago.id).length / totalMovimientos) * 100 
          : 0;

        return {
          medioPago: medioPagoDTO,
          totalMovido,
          totalIngresos: resumen.ingresos,
          totalEgresos: resumen.egresos,
          porcentajeMovimientos: Number(porcentaje.toFixed(2)),
        };
      })
    );

    return resumenes.sort((a, b) => b.totalMovido - a.totalMovido);
  }

  private async calcularComparacionMesAnterior(
    usuarioId: number,
    anio: number,
    mes: MesEnum,
    totalIngresos: number,
    totalEgresos: number,
    balance: number,
  ): Promise<ComparacionMesAnteriorDTO> {
    // Calcular mes anterior
    const meses = Object.values(MesEnum);
    const indiceMesActual = meses.indexOf(mes);
    let mesAnterior: MesEnum;
    let anioAnterior = anio;

    if (indiceMesActual === 0) {
      // Si es enero, el mes anterior es diciembre del año anterior
      mesAnterior = MesEnum.DICIEMBRE;
      anioAnterior = anio - 1;
    } else {
      mesAnterior = meses[indiceMesActual - 1];
    }

    // Buscar información inicial del mes anterior
    const infoInicialAnterior = await this.infoInicialRepository.findByUsuarioAndMes(
      usuarioId,
      anioAnterior,
      mesAnterior,
    );

    if (!infoInicialAnterior) {
      // No hay datos del mes anterior
      return {
        variacionIngresos: 0,
        variacionEgresos: 0,
        variacionBalance: 0,
      };
    }

    // Obtener movimientos del mes anterior
    const movimientosAnteriores = await this.movimientoRepository.find({
      where: { infoInicial: { id: infoInicialAnterior.id } },
    });

    const totalIngresosAnterior = movimientosAnteriores
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.INGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totalEgresosAnterior = movimientosAnteriores
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.EGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const balanceAnterior = totalIngresosAnterior - totalEgresosAnterior;

    // Calcular variaciones porcentuales
    const variacionIngresos = totalIngresosAnterior > 0
      ? ((totalIngresos - totalIngresosAnterior) / totalIngresosAnterior) * 100
      : totalIngresos > 0 ? 100 : 0;

    const variacionEgresos = totalEgresosAnterior > 0
      ? ((totalEgresos - totalEgresosAnterior) / totalEgresosAnterior) * 100
      : totalEgresos > 0 ? 100 : 0;

    const variacionBalance = balanceAnterior !== 0
      ? ((balance - balanceAnterior) / Math.abs(balanceAnterior)) * 100
      : balance !== 0 ? (balance > 0 ? 100 : -100) : 0;

    return {
      totalIngresosAnterior,
      totalEgresosAnterior,
      balanceAnterior,
      variacionIngresos: Number(variacionIngresos.toFixed(2)),
      variacionEgresos: Number(variacionEgresos.toFixed(2)),
      variacionBalance: Number(variacionBalance.toFixed(2)),
    };
  }
}

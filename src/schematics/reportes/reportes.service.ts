import { Injectable, NotFoundException } from '@nestjs/common';
import { ReporteMensualRequestDto } from './dto/reporte-mensual-request.dto';
import { ReporteMensualDTO, SaldoMedioPagoDTO, ResumenCategoriaDTO, ResumenMedioPagoDTO, ComparacionMesAnteriorDTO } from './dto/reporte-mensual.dto';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { MesEnum } from 'src/common/enums/mes-enum';
import { MedioPagoMapper } from '../medio-pago/mappers/medio-pago.mapper';
import { CategoriaMapper } from '../categoria/mappers/categoria.mapper';
import { ReporteMensualResumen } from './entities/reporte-mensual-resumen.entity';
import { ReporteMensualPorMedioPago } from './entities/reporte-mensual-por-medio-pago.entity';
import { ReporteMensualPorCategoria } from './entities/reporte-mensual-por-categoria.entity';
import { ReporteMensualResumenRepository } from './repository/reporte-mensual-resumen.repository';
import { ReporteMensualPorMedioPagoRepository } from './repository/reporte-mensual-por-medio-pago.repository';
import { ReporteMensualPorCategoriaRepository } from './repository/reporte-mensual-por-categoria.repository';
import { InfoInicial } from '../info-inicial/entities/info-inicial.entity';

@Injectable()
export class ReportesService {
  constructor(
    private infoInicialRepository: InfoInicialRepository,
    private movimientoRepository: MovimientoRepository,
    private medioPagoMapper: MedioPagoMapper,
    private categoriaMapper: CategoriaMapper,
    private reporteMensualResumenRepository: ReporteMensualResumenRepository,
    private reporteMensualPorMedioPagoRepository: ReporteMensualPorMedioPagoRepository,
    private reporteMensualPorCategoriaRepository: ReporteMensualPorCategoriaRepository,
  ) {}

  /**
   * Recalcula y persiste el resumen mensual para un InfoInicial.
   * Se invoca al crear/actualizar/eliminar movimientos del mes (incl. pagos gasto fijo).
   */
  async recalcularResumenMensual(infoInicialId: number): Promise<void> {
    const infoInicial = await this.infoInicialRepository.findOne({
      where: { id: infoInicialId },
      relations: ['infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });
    if (!infoInicial) return;

    const movimientos = await this.movimientoRepository.find({
      where: { infoInicial: { id: infoInicialId } },
      relations: ['categoria', 'medioPago'],
    });

    const totalIngresos = movimientos
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.INGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const totalEgresos = movimientos
      .filter(m => m.tipoMovimiento === TipoMovimientoEnum.EGRESO)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const balance = totalIngresos - totalEgresos;

    const medioPagoMap = new Map<number, { medioPago: any; totalIngresos: number; totalEgresos: number; cantidad: number }>();
    const categoriaMap = new Map<number, { categoria: any; total: number; cantidad: number }>();

    for (const m of movimientos) {
      const monto = Number(m.monto);
      if (m.medioPago?.id) {
        const prev = medioPagoMap.get(m.medioPago.id) ?? {
          medioPago: m.medioPago,
          totalIngresos: 0,
          totalEgresos: 0,
          cantidad: 0,
        };
        if (m.tipoMovimiento === TipoMovimientoEnum.INGRESO) prev.totalIngresos += monto;
        else prev.totalEgresos += monto;
        prev.cantidad += 1;
        medioPagoMap.set(m.medioPago.id, prev);
      }
      if (m.tipoMovimiento === TipoMovimientoEnum.EGRESO && m.categoria?.id) {
        const prev = categoriaMap.get(m.categoria.id) ?? { categoria: m.categoria, total: 0, cantidad: 0 };
        prev.total += monto;
        prev.cantidad += 1;
        categoriaMap.set(m.categoria.id, prev);
      }
    }

    await this.reporteMensualPorCategoriaRepository.deleteByInfoInicialId(infoInicialId);
    await this.reporteMensualPorMedioPagoRepository.deleteByInfoInicialId(infoInicialId);
    await this.reporteMensualResumenRepository.deleteByInfoInicialId(infoInicialId);

    const cab = new ReporteMensualResumen();
    cab.infoInicial = infoInicial as InfoInicial;
    cab.totalIngresos = totalIngresos;
    cab.totalEgresos = totalEgresos;
    cab.balance = balance;
    cab.totalMovimientos = movimientos.length;
    await this.reporteMensualResumenRepository.save(cab);

    for (const [, agg] of medioPagoMap) {
      const rel = new ReporteMensualPorMedioPago();
      rel.infoInicial = infoInicial as InfoInicial;
      rel.medioPago = agg.medioPago;
      rel.totalIngresos = agg.totalIngresos;
      rel.totalEgresos = agg.totalEgresos;
      rel.cantidadMovimientos = agg.cantidad;
      await this.reporteMensualPorMedioPagoRepository.save(rel);
    }
    for (const [, agg] of categoriaMap) {
      const rel = new ReporteMensualPorCategoria();
      rel.infoInicial = infoInicial as InfoInicial;
      rel.categoria = agg.categoria;
      rel.total = agg.total;
      rel.cantidadMovimientos = agg.cantidad;
      await this.reporteMensualPorCategoriaRepository.save(rel);
    }
  }

  async generarReporteMensual(request: ReporteMensualRequestDto, usuarioId: number): Promise<ReporteMensualDTO> {
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

    let resumenCab = await this.reporteMensualResumenRepository.findByInfoInicialId(infoInicial.id);
    if (!resumenCab) {
      await this.recalcularResumenMensual(infoInicial.id);
      resumenCab = await this.reporteMensualResumenRepository.findByInfoInicialId(infoInicial.id);
    }

    const totalIngresos = Number(resumenCab?.totalIngresos ?? 0);
    const totalEgresos = Number(resumenCab?.totalEgresos ?? 0);
    const balance = Number(resumenCab?.balance ?? 0);
    const totalMovimientos = resumenCab?.totalMovimientos ?? 0;

    const porMedioPago = await this.reporteMensualPorMedioPagoRepository.find({
      where: { infoInicial: { id: infoInicial.id } },
      relations: ['medioPago'],
    });
    const porCategoria = await this.reporteMensualPorCategoriaRepository.find({
      where: { infoInicial: { id: infoInicial.id } },
      relations: ['categoria'],
    });

    const saldosPorMedioPago = await this.buildSaldosPorMedioPagoDesdeCache(infoInicial, porMedioPago);
    const balanceTotal = saldosPorMedioPago.reduce((sum, s) => sum + s.saldoActual, 0);

    const resumenPorCategoria: ResumenCategoriaDTO[] = await Promise.all(
      porCategoria.map(async (r) => {
        const categoriaDTO = await this.categoriaMapper.entity2DTO(r.categoria);
        const total = Number(r.total);
        const porcentaje = totalEgresos > 0 ? (total / totalEgresos) * 100 : 0;
        return {
          categoria: categoriaDTO,
          total,
          porcentaje: Number(porcentaje.toFixed(2)),
          cantidadMovimientos: r.cantidadMovimientos,
        };
      })
    );
    resumenPorCategoria.sort((a, b) => b.total - a.total);
    const top5Categorias = resumenPorCategoria.slice(0, 5);

    const resumenPorMedioPago: ResumenMedioPagoDTO[] = await Promise.all(
      porMedioPago.map(async (r) => {
        const medioPagoDTO = await this.medioPagoMapper.entity2DTO(r.medioPago);
        const totalMovido = Number(r.totalIngresos) + Number(r.totalEgresos);
        const porcentaje = totalMovimientos > 0 ? (r.cantidadMovimientos / totalMovimientos) * 100 : 0;
        return {
          medioPago: medioPagoDTO,
          totalMovido,
          totalIngresos: Number(r.totalIngresos),
          totalEgresos: Number(r.totalEgresos),
          porcentajeMovimientos: Number(porcentaje.toFixed(2)),
        };
      })
    );
    resumenPorMedioPago.sort((a, b) => b.totalMovido - a.totalMovido);

    const comparacionMesAnterior = await this.calcularComparacionMesAnterior(
      usuarioId,
      request.anio,
      request.mes,
      totalIngresos,
      totalEgresos,
      balance,
    );

    return {
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
  }

  private async buildSaldosPorMedioPagoDesdeCache(
    infoInicial: any,
    porMedioPago: ReporteMensualPorMedioPago[],
  ): Promise<SaldoMedioPagoDTO[]> {
    const saldoInicialMap = new Map<number, number>();
    if (infoInicial.infoInicialMedioPagos) {
      for (const imp of infoInicial.infoInicialMedioPagos) {
        saldoInicialMap.set(imp.medioPago.id, Number(imp.monto));
      }
    }
    const saldos: SaldoMedioPagoDTO[] = [];
    for (const r of porMedioPago) {
      const medioPagoDTO = await this.medioPagoMapper.entity2DTO(r.medioPago);
      const saldoInicial = saldoInicialMap.get(r.medioPago.id) ?? 0;
      const totalIng = Number(r.totalIngresos);
      const totalEgr = Number(r.totalEgresos);
      saldos.push({
        medioPago: medioPagoDTO,
        saldoInicial,
        totalIngresos: totalIng,
        totalEgresos: totalEgr,
        saldoActual: saldoInicial + totalIng - totalEgr,
      });
    }
    for (const [medId, monto] of saldoInicialMap) {
      if (!saldos.some(s => s.medioPago.id === medId)) {
        const medioPago = infoInicial.infoInicialMedioPagos.find((imp: any) => imp.medioPago.id === medId)?.medioPago;
        if (medioPago) {
          const medioPagoDTO = await this.medioPagoMapper.entity2DTO(medioPago);
          saldos.push({
            medioPago: medioPagoDTO,
            saldoInicial: monto,
            totalIngresos: 0,
            totalEgresos: 0,
            saldoActual: monto,
          });
        }
      }
    }
    return saldos;
  }

  private async calcularComparacionMesAnterior(
    usuarioId: number,
    anio: number,
    mes: MesEnum,
    totalIngresos: number,
    totalEgresos: number,
    balance: number,
  ): Promise<ComparacionMesAnteriorDTO> {
    const meses = Object.values(MesEnum);
    const indiceMesActual = meses.indexOf(mes);
    let mesAnterior: MesEnum;
    let anioAnterior = anio;
    if (indiceMesActual === 0) {
      mesAnterior = MesEnum.DICIEMBRE;
      anioAnterior = anio - 1;
    } else {
      mesAnterior = meses[indiceMesActual - 1];
    }

    const infoInicialAnterior = await this.infoInicialRepository.findByUsuarioAndMes(
      usuarioId,
      anioAnterior,
      mesAnterior,
    );
    if (!infoInicialAnterior) {
      return { variacionIngresos: 0, variacionEgresos: 0, variacionBalance: 0 };
    }

    let totalIngresosAnterior: number;
    let totalEgresosAnterior: number;
    const resumenAnterior = await this.reporteMensualResumenRepository.findByInfoInicialId(infoInicialAnterior.id);
    if (resumenAnterior) {
      totalIngresosAnterior = Number(resumenAnterior.totalIngresos);
      totalEgresosAnterior = Number(resumenAnterior.totalEgresos);
    } else {
      const movimientosAnteriores = await this.movimientoRepository.find({
        where: { infoInicial: { id: infoInicialAnterior.id } },
      });
      totalIngresosAnterior = movimientosAnteriores
        .filter(m => m.tipoMovimiento === TipoMovimientoEnum.INGRESO)
        .reduce((sum, m) => sum + Number(m.monto), 0);
      totalEgresosAnterior = movimientosAnteriores
        .filter(m => m.tipoMovimiento === TipoMovimientoEnum.EGRESO)
        .reduce((sum, m) => sum + Number(m.monto), 0);
    }
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

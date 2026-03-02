import { Injectable } from '@nestjs/common';
import { MesEnum } from 'src/common/enums/mes-enum';
import { mesEnumToNumero } from 'src/common/utils/mes-enum.utils';
import { CuentaRepository } from '../cuenta/repository/cuenta.repository';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { PresupuestoService } from '../presupuesto/presupuesto.service';
import {
  DashboardResponse,
  DashboardGastoCategoria,
  DashboardGastoCuenta,
  DashboardUltimoMovimiento,
  DashboardPresupuestoItem,
} from './dto/dashboard-response.dto';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';

const TOP_CATEGORIAS_LIMIT = 5;
const ULTIMOS_MOVIMIENTOS_LIMIT = 10;

@Injectable()
export class DashboardService {
  constructor(
    private readonly cuentaRepository: CuentaRepository,
    private readonly movimientoRepository: MovimientoRepository,
    private readonly presupuestoService: PresupuestoService,
  ) {}

  async getDashboard(
    userId: number,
    mes: MesEnum,
    anio: number,
  ): Promise<DashboardResponse> {
    const mesNum = mesEnumToNumero(mes);

    const [saldoTotal, resumenMes, gastosPorCategoria, gastosPorCuenta, ultimosMovimientos, presupuestos] =
      await Promise.all([
        this.cuentaRepository.sumSaldoByUsuario(userId),
        this.movimientoRepository.getResumenMes(userId, mesNum, anio),
        this.movimientoRepository.getGastosPorCategoria(userId, mesNum, anio),
        this.movimientoRepository.getGastosPorCuenta(userId, mesNum, anio),
        this.movimientoRepository.getUltimosMovimientos(
          userId,
          ULTIMOS_MOVIMIENTOS_LIMIT,
        ),
        this.presupuestoService.getEstado(
          userId,
          mes,
          anio,
          (uid, m, a) =>
            this.movimientoRepository.sumEgresosByCategoriaAndMesAnio(uid, m, a),
        ),
      ]);

    const ingresosMes = resumenMes.ingresos;
    const egresosMes = resumenMes.egresos;
    const balanceMes = ingresosMes - egresosMes;

    const gastosPorCategoriaDto: DashboardGastoCategoria[] = gastosPorCategoria.map(
      (g) => ({ categoria: g.categoriaNombre, total: g.total }),
    );

    const topCategoriasGasto = [...gastosPorCategoriaDto]
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_CATEGORIAS_LIMIT);

    const gastosPorCuentaDto: DashboardGastoCuenta[] = gastosPorCuenta.map(
      (g) => ({ cuenta: g.cuentaNombre, total: g.total }),
    );

    const ultimosMovimientosDto: DashboardUltimoMovimiento[] =
      ultimosMovimientos.map((m) => ({
        descripcion: m.descripcion,
        monto: Number(m.monto),
        tipo: m.tipoMovimiento,
        fecha: typeof m.fecha === 'string' ? m.fecha : m.fecha?.toISOString()?.split('T')[0] ?? '',
      }));

    const presupuestosDto: DashboardPresupuestoItem[] = presupuestos.map(
      (p) => ({
        categoria: p.categoria,
        presupuesto: p.presupuesto,
        gastado: p.gastado,
        restante: Math.max(0, p.presupuesto - p.gastado),
        porcentaje: p.porcentaje,
        estado: p.estado,
      }),
    );

    const alertas = this.buildAlertas(presupuestos);

    return {
      saldoTotal,
      ingresosMes,
      egresosMes,
      balanceMes,
      topCategoriasGasto,
      gastosPorCategoria: gastosPorCategoriaDto,
      gastosPorCuenta: gastosPorCuentaDto,
      ultimosMovimientos: ultimosMovimientosDto,
      presupuestos: presupuestosDto,
      alertas,
    };
  }

  private buildAlertas(presupuestos: DashboardPresupuestoItem[]): string[] {
    const list: string[] = [];
    for (const p of presupuestos) {
      if (p.estado === 'EXCEDIDO') {
        list.push(`Excediste el presupuesto en ${p.categoria}`);
      } else if (p.estado === 'ALERTA') {
        list.push(`Te estás acercando al límite en ${p.categoria}`);
      }
    }
    return list;
  }
}

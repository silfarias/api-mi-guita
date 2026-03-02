import { Injectable } from '@nestjs/common';
import { MesEnum } from 'src/common/enums/mes-enum';
import { mesEnumToNumero } from 'src/common/utils/mes-enum.utils';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';

export interface ReporteCategoriaItem {
  categoria: string;
  total: number;
}

export interface ReporteCuentaItem {
  cuenta: string;
  ingresos: number;
  egresos: number;
}

export interface ReporteEvolucionItem {
  mes: string;
  balance: number;
}

export interface ReporteFlujoResponse {
  ingresos: number;
  egresos: number;
  balance: number;
}

@Injectable()
export class ReportesService {
  constructor(private readonly movimientoRepository: MovimientoRepository) {}

  async getReportePorCategoria(
    usuarioId: number,
    mes: MesEnum,
    anio: number,
  ): Promise<ReporteCategoriaItem[]> {
    const mesNum = mesEnumToNumero(mes);
    const rows = await this.movimientoRepository.getGastosPorCategoria(
      usuarioId,
      mesNum,
      anio,
    );
    return rows.map((r) => ({ categoria: r.categoriaNombre, total: r.total }));
  }

  async getReportePorCuenta(
    usuarioId: number,
    mes?: MesEnum,
    anio?: number,
  ): Promise<ReporteCuentaItem[]> {
    const mesNum = mes != null && anio != null ? mesEnumToNumero(mes) : undefined;
    const rows = await this.movimientoRepository.getIngresosEgresosPorCuenta(
      usuarioId,
      mesNum,
      anio,
    );
    return rows.map((r) => ({
      cuenta: r.cuentaNombre,
      ingresos: r.ingresos,
      egresos: r.egresos,
    }));
  }

  async getReporteEvolucion(
    usuarioId: number,
    anio: number,
  ): Promise<ReporteEvolucionItem[]> {
    const rows = await this.movimientoRepository.getBalancePorMes(
      usuarioId,
      anio,
    );
    return rows.map((r) => ({ mes: r.mesNombre, balance: r.balance }));
  }

  async getReporteFlujo(
    usuarioId: number,
    mes?: MesEnum,
    anio?: number,
  ): Promise<ReporteFlujoResponse> {
    const mesNum = mes != null && anio != null ? mesEnumToNumero(mes) : undefined;
    return this.movimientoRepository.getFlujo(usuarioId, mesNum, anio);
  }
}

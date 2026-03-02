export interface DashboardGastoCategoria {
  categoria: string;
  total: number;
}

export interface DashboardGastoCuenta {
  cuenta: string;
  total: number;
}

export interface DashboardUltimoMovimiento {
  descripcion: string;
  monto: number;
  tipo: string;
  fecha: string;
}

export interface DashboardPresupuestoItem {
  categoria: string;
  presupuesto: number;
  gastado: number;
  restante: number;
  porcentaje: number;
  estado: string;
}

export interface DashboardResponse {
  saldoTotal: number;
  ingresosMes: number;
  egresosMes: number;
  balanceMes: number;
  topCategoriasGasto: DashboardGastoCategoria[];
  gastosPorCategoria: DashboardGastoCategoria[];
  gastosPorCuenta: DashboardGastoCuenta[];
  ultimosMovimientos: DashboardUltimoMovimiento[];
  presupuestos: DashboardPresupuestoItem[];
  alertas: string[];
}

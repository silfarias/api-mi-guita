import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MedioPagoDTO } from 'src/schematics/medio-pago/dto/medio-pago.dto';
import { CategoriaDTO } from 'src/schematics/categoria/dto/categoria.dto';
import { MesEnum } from 'src/common/enums/mes-enum';

export class SaldoMedioPagoDTO {
  @ApiProperty({ description: 'Medio de pago', type: () => MedioPagoDTO })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago: MedioPagoDTO;

  @ApiProperty({ description: 'Saldo inicial del mes', example: 20000 })
  @Expose()
  saldoInicial: number;

  @ApiProperty({ description: 'Total de ingresos en este medio', example: 5000 })
  @Expose()
  totalIngresos: number;

  @ApiProperty({ description: 'Total de egresos en este medio', example: 3000 })
  @Expose()
  totalEgresos: number;

  @ApiProperty({ description: 'Saldo actual (inicial + ingresos - egresos)', example: 22000 })
  @Expose()
  saldoActual: number;
}

export class ResumenCategoriaDTO {
  @ApiProperty({ description: 'Categoría', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;

  @ApiProperty({ description: 'Total gastado en esta categoría', example: 12000 })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Porcentaje del total de egresos', example: 34.3 })
  @Expose()
  porcentaje: number;

  @ApiProperty({ description: 'Cantidad de movimientos en esta categoría', example: 15 })
  @Expose()
  cantidadMovimientos: number;
}

export class ResumenMedioPagoDTO {
  @ApiProperty({ description: 'Medio de pago', type: () => MedioPagoDTO })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago: MedioPagoDTO;

  @ApiProperty({ description: 'Total movido (ingresos + egresos)', example: 15000 })
  @Expose()
  totalMovido: number;

  @ApiProperty({ description: 'Total de ingresos', example: 8000 })
  @Expose()
  totalIngresos: number;

  @ApiProperty({ description: 'Total de egresos', example: 7000 })
  @Expose()
  totalEgresos: number;

  @ApiProperty({ description: 'Porcentaje del total de movimientos', example: 25.5 })
  @Expose()
  porcentajeMovimientos: number;
}

export class ComparacionMesAnteriorDTO {
  @ApiProperty({ description: 'Total ingresos del mes anterior', example: 45000, required: false })
  @Expose()
  totalIngresosAnterior?: number;

  @ApiProperty({ description: 'Total egresos del mes anterior', example: 30000, required: false })
  @Expose()
  totalEgresosAnterior?: number;

  @ApiProperty({ description: 'Balance del mes anterior', example: 15000, required: false })
  @Expose()
  balanceAnterior?: number;

  @ApiProperty({ description: 'Variación porcentual de ingresos', example: 11.1 })
  @Expose()
  variacionIngresos: number;

  @ApiProperty({ description: 'Variación porcentual de egresos', example: 16.7 })
  @Expose()
  variacionEgresos: number;

  @ApiProperty({ description: 'Variación porcentual del balance', example: -6.7 })
  @Expose()
  variacionBalance: number;
}

export class ReporteMensualDTO {
  @ApiProperty({ description: 'Año del reporte', example: 2026 })
  @Expose()
  anio: number;

  @ApiProperty({ description: 'Mes del reporte', enum: MesEnum, example: MesEnum.FEBRERO })
  @Expose()
  mes: MesEnum;

  @ApiProperty({ description: 'Total de ingresos del mes', example: 50000 })
  @Expose()
  totalIngresos: number;

  @ApiProperty({ description: 'Total de egresos del mes', example: 35000 })
  @Expose()
  totalEgresos: number;

  @ApiProperty({ description: 'Balance del mes (ingresos - egresos)', example: 15000 })
  @Expose()
  balance: number;

  @ApiProperty({ description: 'Saldos actuales por medio de pago', type: [SaldoMedioPagoDTO] })
  @Expose()
  @Type(() => SaldoMedioPagoDTO)
  saldosPorMedioPago: SaldoMedioPagoDTO[];

  @ApiProperty({ description: 'Balance total del usuario (suma de todos los saldos)', example: 50000 })
  @Expose()
  balanceTotal: number;

  @ApiProperty({ description: 'Resumen por categoría', type: [ResumenCategoriaDTO] })
  @Expose()
  @Type(() => ResumenCategoriaDTO)
  resumenPorCategoria: ResumenCategoriaDTO[];

  @ApiProperty({ description: 'Top 5 categorías con más gastos', type: [ResumenCategoriaDTO] })
  @Expose()
  @Type(() => ResumenCategoriaDTO)
  top5Categorias: ResumenCategoriaDTO[];

  @ApiProperty({ description: 'Resumen por medio de pago', type: [ResumenMedioPagoDTO] })
  @Expose()
  @Type(() => ResumenMedioPagoDTO)
  resumenPorMedioPago: ResumenMedioPagoDTO[];

  @ApiProperty({ description: 'Comparación con mes anterior', type: () => ComparacionMesAnteriorDTO, required: false })
  @Expose()
  @Type(() => ComparacionMesAnteriorDTO)
  comparacionMesAnterior?: ComparacionMesAnteriorDTO;
}

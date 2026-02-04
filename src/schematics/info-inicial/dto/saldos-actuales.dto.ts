import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MedioPagoDTO } from 'src/schematics/medio-pago/dto/medio-pago.dto';

export class SaldoActualDTO {
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

export class SaldosActualesDTO {
  @ApiProperty({ description: 'Saldos actuales por medio de pago', type: [SaldoActualDTO] })
  @Expose()
  @Type(() => SaldoActualDTO)
  saldosPorMedioPago: SaldoActualDTO[];

  @ApiProperty({ description: 'Balance total del usuario (suma de todos los saldos)', example: 50000 })
  @Expose()
  balanceTotal: number;
}

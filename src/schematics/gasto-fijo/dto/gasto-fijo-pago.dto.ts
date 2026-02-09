import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { GastoFijoDTO } from './gasto-fijo.dto';
import { InfoInicialDTO } from 'src/schematics/info-inicial/dto/info-inicial.dto';
import { MedioPagoDTO } from 'src/schematics/medio-pago/dto/medio-pago.dto';

export class GastoFijoPagoDTO extends CommonDTO {

  @ApiProperty({ description: 'Gasto fijo asociado', type: () => GastoFijoDTO })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastoFijo: GastoFijoDTO;

  @ApiProperty({ description: 'Información inicial (mes/año) asociada', type: () => InfoInicialDTO })
  @Expose()
  @Type(() => InfoInicialDTO)
  infoInicial: InfoInicialDTO;

  @ApiProperty({ description: 'Medio de pago asociado', type: () => MedioPagoDTO, required: false })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago?: MedioPagoDTO;

  @ApiProperty({ description: 'Monto pagado del gasto fijo para este mes', example: 5000.00 })
  @Expose()
  montoPago: number;

  @ApiProperty({ description: 'Indica si el gasto fijo ya fue pagado para este mes', example: false })
  @Expose()
  pagado: boolean;
}

export class PagoSimpleDTO {

  @ApiProperty({ description: 'ID del pago del gasto fijo (undefined si aún no existe registro)' })
  @Expose()
  id?: number;

  @ApiProperty({ description: 'Monto pagado del gasto fijo para este mes' })
  @Expose()
  montoPago: number;

  @ApiProperty({ description: 'Indica si el gasto fijo ya fue pagado para este mes' })
  @Expose()
  pagado: boolean;

  @ApiProperty({ description: 'Medio de pago asociado', type: () => MedioPagoDTO, required: false })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago?: MedioPagoDTO;

}

export class Pagos {

  @ApiProperty({ description: 'Gasto fijo asociado', type: () => GastoFijoDTO })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastoFijo: GastoFijoDTO;

  @ApiProperty({ description: 'Pago del gasto fijo para este mes', type: () => PagoSimpleDTO })
  @Expose()
  @Type(() => PagoSimpleDTO)
  pago: PagoSimpleDTO
}

export class PagosGastoFijoDTO {

  @ApiProperty({ description: 'Información inicial (mes/año) asociada', type: () => InfoInicialDTO })
  @Expose()
  @Type(() => InfoInicialDTO)
  infoInicial: InfoInicialDTO;

  @ApiProperty({ description: 'Pagos del gasto fijo para este mes', type: () => [Pagos] })
  @Expose()
  @Type(() => Pagos)
  pagos: Pagos[]

}
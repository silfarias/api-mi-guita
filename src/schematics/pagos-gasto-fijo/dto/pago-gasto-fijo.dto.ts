import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { GastoFijoDTO } from 'src/schematics/gasto-fijo/dto/gasto-fijo.dto';
import { MesEnum } from 'src/common/enums/mes-enum';

export class PagoGastoFijoDTO extends CommonDTO {

  @ApiProperty({ description: 'Gasto fijo asociado', type: () => GastoFijoDTO })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastoFijo: GastoFijoDTO;

  @ApiProperty({ description: 'Mes', enum: MesEnum })
  @Expose()
  mes: MesEnum;

  @ApiProperty({ description: 'Año', example: 2026 })
  @Expose()
  anio: number;

  @ApiProperty({ description: 'Monto pagado para este mes', example: 5000 })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Indica si está pagado', example: false })
  @Expose()
  pagado: boolean;
}

export class PagoSimpleDTO {

  @ApiProperty({ description: 'ID del pago (undefined si no existe registro)' })
  @Expose()
  id?: number;

  @ApiProperty({ description: 'Monto pagado para este mes' })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Indica si está pagado' })
  @Expose()
  pagado: boolean;
}

export class Pagos {

  @ApiProperty({ description: 'Gasto fijo', type: () => GastoFijoDTO })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastoFijo: GastoFijoDTO;

  @ApiProperty({ description: 'Pago del gasto fijo para este mes', type: () => PagoSimpleDTO })
  @Expose()
  @Type(() => PagoSimpleDTO)
  pago: PagoSimpleDTO;
}

export class PagosGastoFijoDTO {

  @ApiProperty({ description: 'Año', example: 2026 })
  @Expose()
  anio: number;

  @ApiProperty({ description: 'Mes', enum: MesEnum })
  @Expose()
  mes: MesEnum;

  @ApiProperty({ description: 'Pagos por gasto fijo para este mes', type: () => [Pagos] })
  @Expose()
  @Type(() => Pagos)
  pagos: Pagos[];
}

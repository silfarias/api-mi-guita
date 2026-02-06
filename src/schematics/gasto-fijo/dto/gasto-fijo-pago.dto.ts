import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { GastoFijoDTO } from './gasto-fijo.dto';
import { InfoInicialDTO } from 'src/schematics/info-inicial/dto/info-inicial.dto';

export class GastoFijoPagoDTO extends CommonDTO {

  @ApiProperty({ description: 'Gasto fijo asociado', type: () => GastoFijoDTO })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastoFijo: GastoFijoDTO;

  @ApiProperty({ description: 'Información inicial (mes/año) asociada', type: () => InfoInicialDTO })
  @Expose()
  @Type(() => InfoInicialDTO)
  infoInicial: InfoInicialDTO;

  @ApiProperty({ description: 'Indica si el gasto fijo ya fue pagado para este mes', example: false })
  @Expose()
  pagado: boolean;
}

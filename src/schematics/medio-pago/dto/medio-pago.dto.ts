import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { CommonDTO } from 'src/common/dto/common.dto';
import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';

export class MedioPagoDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre del medio de pago', example: 'Mercado Pago' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Tipo de medio de pago', enum: TipoMedioPagoEnum, example: TipoMedioPagoEnum.BILLETERA_VIRTUAL })
  @Expose()
  tipo: TipoMedioPagoEnum;
}

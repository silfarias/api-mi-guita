import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { MedioPagoDTO } from 'src/schematics/medio-pago/dto/medio-pago.dto';

export class MedioPagoInfoDTO extends CommonDTO {

  @ApiProperty({ description: 'Monto en este medio de pago', example: 20000 })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Medio de pago', type: () => MedioPagoDTO })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago: MedioPagoDTO;
}

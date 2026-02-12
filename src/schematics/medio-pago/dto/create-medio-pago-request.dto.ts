import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, MaxLength } from 'class-validator';

import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';

export class CreateMedioPagoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del medio de pago (billetera virtual o banco)', 
    type: String, 
    nullable: false, 
    example: 'Mercado Pago' 
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ 
    description: 'Tipo de medio de pago', 
    enum: TipoMedioPagoEnum, 
    nullable: false, 
    example: TipoMedioPagoEnum.BILLETERA_VIRTUAL 
  })
  @IsNotEmpty()
  @IsEnum(TipoMedioPagoEnum)
  tipo: TipoMedioPagoEnum;
}

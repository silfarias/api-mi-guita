import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';

export class UpdateMedioPagoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del medio de pago (billetera virtual o banco)', 
    type: String, 
    nullable: true, 
    example: 'Mercado Pago' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({ 
    description: 'Tipo de medio de pago', 
    enum: TipoMedioPagoEnum, 
    nullable: true, 
    example: TipoMedioPagoEnum.BILLETERA_VIRTUAL 
  })
  @IsOptional()
  @IsEnum(TipoMedioPagoEnum)
  tipo?: TipoMedioPagoEnum;
}

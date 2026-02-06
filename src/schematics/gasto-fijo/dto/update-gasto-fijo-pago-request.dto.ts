import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateGastoFijoPagoRequestDto {

  @ApiProperty({ 
    description: 'Indica si el gasto fijo ya fue pagado', 
    type: Boolean, 
    nullable: true, 
    example: false
  })
  @IsOptional()
  @IsBoolean()
  pagado?: boolean;
}

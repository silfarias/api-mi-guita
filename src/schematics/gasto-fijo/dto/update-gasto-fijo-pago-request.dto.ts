import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGastoFijoPagoRequestDto {

  @ApiProperty({ 
    description: 'Monto pagado del gasto fijo para este mes', 
    type: Number, 
    nullable: true, 
    example: 5000.00,
    minimum: 0.01
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  montoPago?: number;

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

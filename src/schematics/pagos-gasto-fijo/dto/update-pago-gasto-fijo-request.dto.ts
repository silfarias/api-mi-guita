import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePagoGastoFijoRequestDto {

  @ApiProperty({ description: 'ID del medio de pago', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  medioPagoId?: number;

  @ApiProperty({ 
    description: 'Monto pagado del gasto fijo para este mes', 
    type: Number, 
    nullable: true, 
    example: 5000.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
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

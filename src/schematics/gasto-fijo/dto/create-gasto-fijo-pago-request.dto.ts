import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGastoFijoPagoRequestDto {

  @ApiProperty({ 
    description: 'ID del gasto fijo', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  gastoFijoId: number;

  @ApiProperty({ 
    description: 'ID de la información inicial (mes/año)', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  infoInicialId: number;

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
    minimum: 0.01
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montoPago?: number;

  @ApiProperty({ 
    description: 'Indica si el gasto fijo ya fue pagado', 
    type: Boolean, 
    nullable: true, 
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  pagado?: boolean;
}

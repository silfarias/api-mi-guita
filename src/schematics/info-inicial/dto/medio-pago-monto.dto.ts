import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MedioPagoMontoRequestDto {
  @ApiProperty({ 
    description: 'ID del medio de pago', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  medioPagoId: number;

  @ApiProperty({ 
    description: 'Monto inicial en este medio de pago', 
    type: Number, 
    nullable: false, 
    example: 20000,
    minimum: 0
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto: number;
}
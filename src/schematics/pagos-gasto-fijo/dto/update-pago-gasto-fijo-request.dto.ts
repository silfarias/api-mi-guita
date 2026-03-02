import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePagoGastoFijoRequestDto {

  @ApiProperty({
    description: 'Monto pagado',
    type: Number,
    required: false,
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiProperty({
    description: 'Indica si está pagado',
    type: Boolean,
    required: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pagado?: boolean;
}

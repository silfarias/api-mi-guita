import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferenciaRequestDto {
  @ApiProperty({
    description: 'ID de la cuenta origen (de donde se transfiere)',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cuentaOrigenId: number;

  @ApiProperty({
    description: 'ID de la cuenta destino (hacia donde se transfiere)',
    type: Number,
    required: true,
    example: 2,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cuentaDestinoId: number;

  @ApiProperty({
    description: 'Monto a transferir',
    type: Number,
    required: true,
    example: 5000,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({
    description: 'Fecha de la transferencia (opcional, por defecto hoy)',
    type: String,
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({
    description: 'Descripción de la transferencia (opcional)',
    type: String,
    required: false,
    example: 'Transferencia de efectivo a Mercado Pago',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

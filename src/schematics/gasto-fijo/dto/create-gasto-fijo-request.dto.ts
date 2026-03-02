import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoGastoFijoEnum } from 'src/common/enums/tipo-gasto-fijo.enum';

export class CreateGastoFijoRequestDto {

  @ApiProperty({
    description: 'Nombre del gasto fijo',
    type: String,
    required: true,
    example: 'Internet/WiFi',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Tipo de gasto fijo',
    enum: TipoGastoFijoEnum,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(TipoGastoFijoEnum)
  tipo: TipoGastoFijoEnum;

  @ApiProperty({
    description: 'Monto estimado del gasto fijo',
    type: Number,
    required: true,
    example: 5000.00,
    minimum: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoEstimado: number;

  @ApiProperty({
    description: 'Día de vencimiento (ej: primer día del mes para facturas)',
    type: String,
    format: 'date',
    required: true,
    example: '2026-03-01',
  })
  @IsNotEmpty()
  @IsDateString()
  diaVencimiento: string;

  @ApiProperty({
    description: 'ID de la categoría del gasto fijo',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoriaId: number;

  @ApiProperty({
    description: 'Indica si el gasto fijo es un debito automatico',
    type: Boolean,
    required: true,
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  esDebitoAutomatico: boolean;
}
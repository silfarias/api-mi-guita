import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional, IsDate, Min } from 'class-validator';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { Type } from 'class-transformer';

export class CreateMovimientoRequestDto {

  @ApiProperty({
    description: 'ID de la cuenta donde se registra el movimiento',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cuentaId: number;

  @ApiProperty({
    description: 'Fecha del movimiento (opcional, si no se envía se usa la fecha actual)',
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDate()
  fecha?: Date;

  @ApiProperty({
    description: 'Tipo de movimiento',
    enum: TipoMovimientoEnum,
    required: true,
    example: TipoMovimientoEnum.EGRESO,
  })
  @IsNotEmpty()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento: TipoMovimientoEnum;

  @ApiProperty({
    description: 'Descripción del movimiento',
    type: String,
    required: true,
    example: 'Pan relleno',
  })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'ID de la categoría (opcional para SALDO_INICIAL)',
    type: Number,
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiProperty({
    description: 'Monto del movimiento',
    type: Number,
    required: true,
    example: 3600,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;
}
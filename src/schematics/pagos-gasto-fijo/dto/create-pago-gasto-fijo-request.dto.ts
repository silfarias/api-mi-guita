import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class CreatePagoGastoFijoRequestDto {

  @ApiProperty({
    description: 'ID del gasto fijo',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  gastoFijoId: number;

  @ApiProperty({
    description: 'Año',
    type: Number,
    required: true,
    example: 2026,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  anio: number;

  @ApiProperty({
    description: 'Mes',
    enum: MesEnum,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(MesEnum)
  mes: MesEnum;

  @ApiProperty({
    description: 'ID de la cuenta desde la que se paga',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  cuentaId: number;

  @ApiProperty({
    description: 'Monto pagado',
    type: Number,
    required: false,
    example: 5000,
    minimum: 0,
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

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoGastoFijoEnum } from 'src/common/enums/tipo-gasto-fijo.enum';

export class UpdateGastoFijoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del gasto fijo', 
    type: String, 
    nullable: true, 
    example: 'Internet/WiFi' 
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({
    description: 'Tipo de gasto fijo',
    enum: TipoGastoFijoEnum,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TipoGastoFijoEnum)
  tipo?: TipoGastoFijoEnum;

  @ApiProperty({
    description: 'Monto estimado del gasto fijo',
    type: Number,
    nullable: true,
    example: 5000.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montoEstimado?: number;

  @ApiProperty({
    description: 'Día de vencimiento',
    type: String,
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  diaVencimiento?: string;

  @ApiProperty({ 
    description: 'Indica si el gasto fijo está activo (para mostrar/ocultar en el mes)', 
    type: Boolean, 
    nullable: true, 
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ 
    description: 'ID de la categoría del gasto fijo', 
    type: Number, 
    nullable: true, 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiProperty({
    description: 'Indica si el gasto fijo es un débito automático',
    type: Boolean,
    nullable: true,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  esDebitoAutomatico?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString, IsDateString, Min, IsDate } from 'class-validator';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { Type } from 'class-transformer';

export class UpdateMovimientoRequestDto {

  @ApiProperty({ 
    description: 'Fecha del movimiento', 
    type: Date, 
    nullable: true
  })
  @IsOptional()
  @IsDate()
  fecha?: Date;

  @ApiProperty({ 
    description: 'Tipo de movimiento', 
    enum: TipoMovimientoEnum, 
    nullable: true, 
    example: TipoMovimientoEnum.EGRESO 
  })
  @IsOptional()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento?: TipoMovimientoEnum;

  @ApiProperty({ 
    description: 'ID de la categoría del movimiento', 
    type: Number, 
    nullable: true, 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiProperty({ 
    description: 'Descripción del movimiento', 
    type: String, 
    nullable: true, 
    example: 'Pan relleno' 
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ 
    description: 'Monto del movimiento', 
    type: Number, 
    nullable: true, 
    example: 3600,
    minimum: 0.01
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto?: number;

  @ApiProperty({ 
    description: 'ID del medio de pago utilizado', 
    type: Number, 
    nullable: true, 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  medioPagoId?: number;
}

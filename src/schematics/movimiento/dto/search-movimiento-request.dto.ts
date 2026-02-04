import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { Type } from 'class-transformer';

export class SearchMovimientoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del movimiento', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID de la información inicial', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  infoInicialId?: number;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoEnum, required: false })
  @IsOptional()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento?: TipoMovimientoEnum;

  @ApiProperty({ description: 'ID de la categoría', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiProperty({ description: 'ID del medio de pago', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  medioPagoId?: number;

  @ApiProperty({ description: 'Fecha desde (formato: YYYY-MM-DD)', type: String, required: false })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiProperty({ description: 'Fecha hasta (formato: YYYY-MM-DD)', type: String, required: false })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchGastoFijoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del gasto fijo', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Nombre del gasto fijo', type: String, required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'ID de la categoría', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @ApiProperty({ description: 'Filtrar por gastos fijos activos', type: Boolean, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ description: 'Filtrar por gastos fijos de débito automático', type: Boolean, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  esDebitoAutomatico?: boolean;

  @ApiProperty({ description: 'Filtrar por id del medio de pago', type: Number, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  medioPagoId?: number;
}

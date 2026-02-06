import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchGastoFijoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del gasto fijo', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID de la categoría', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';

export class SearchCategoriaRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID de la categoría', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Nombre de la categoría', type: String, required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Tipo de categoría', enum: TipoCategoriaEnum, required: false })
  @IsOptional()
  @IsEnum(TipoCategoriaEnum)
  tipo?: TipoCategoriaEnum;

  @ApiProperty({ description: 'Estado activo', type: Boolean, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';

export class SearchPersonaRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID de la persona a buscar', type: Number, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiProperty({ description: 'Nombre para filtrar', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Apellido para filtrar', required: false })
  @IsOptional()
  @IsString()
  apellido?: string;
}

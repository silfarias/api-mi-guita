import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';
import { Type } from 'class-transformer';

export class SearchCuentaRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID de la cuenta', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Nombre de la cuenta', type: String, required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum, required: false })
  @IsOptional()
  @IsEnum(TipoCuentaEnum)
  tipo?: TipoCuentaEnum;
}

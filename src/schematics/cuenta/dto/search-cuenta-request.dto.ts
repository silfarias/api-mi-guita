import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';
import { Type } from 'class-transformer';

export class SearchCuentaRequestDto extends BaseSearchDto {
  @ApiProperty({ description: 'ID de la cuenta', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum, required: false })
  @IsOptional()
  @IsEnum(TipoCuentaEnum)
  tipo?: TipoCuentaEnum;
}

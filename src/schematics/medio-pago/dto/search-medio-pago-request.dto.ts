import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';

export class SearchMedioPagoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del medio de pago', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'Nombre del medio de pago', type: String, required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Tipo de medio de pago', enum: TipoMedioPagoEnum, required: false })
  @IsOptional()
  @IsEnum(TipoMedioPagoEnum)
  tipo?: TipoMedioPagoEnum;
}

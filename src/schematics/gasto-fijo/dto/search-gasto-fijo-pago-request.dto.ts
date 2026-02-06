import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchGastoFijoPagoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del gasto fijo pago', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID del gasto fijo', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gastoFijoId?: number;

  @ApiProperty({ description: 'ID de la información inicial (mes/año)', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  infoInicialId?: number;

  @ApiProperty({ description: 'Indica si el gasto fijo está pagado', type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  pagado?: boolean;
}

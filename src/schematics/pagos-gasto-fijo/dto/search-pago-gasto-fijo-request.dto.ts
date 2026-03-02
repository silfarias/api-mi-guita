import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class SearchPagoGastoFijoRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID del pago gasto fijo', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID del gasto fijo', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gastoFijoId?: number;

  @ApiProperty({ description: 'Año', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anio?: number;

  @ApiProperty({ description: 'Mes', enum: MesEnum, required: false })
  @IsOptional()
  @IsEnum(MesEnum)
  mes?: MesEnum;

  @ApiProperty({ description: 'Indica si está pagado', type: Boolean, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pagado?: boolean;
}

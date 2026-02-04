import { ApiProperty } from '@nestjs/swagger';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { MesEnum } from 'src/common/enums/mes-enum';
import { Type } from 'class-transformer';

export class SearchInfoInicialRequestDto extends BaseSearchDto {

  @ApiProperty({ description: 'ID de la información inicial', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ description: 'ID del usuario', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usuarioId?: number;

  @ApiProperty({ description: 'Año', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anio?: number;

  @ApiProperty({ description: 'Mes', enum: MesEnum, required: false })
  @IsOptional()
  @IsEnum(MesEnum)
  mes?: MesEnum;
}

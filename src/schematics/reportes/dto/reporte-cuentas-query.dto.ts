import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class ReporteCuentasQueryDto {
  @ApiProperty({ description: 'Mes (opcional)', enum: MesEnum, required: false })
  @IsOptional()
  @IsEnum(MesEnum)
  mes?: MesEnum;

  @ApiProperty({ description: 'Año (opcional)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;
}

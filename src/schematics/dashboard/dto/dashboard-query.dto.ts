import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class DashboardQueryDto {
  @ApiProperty({ description: 'Mes', enum: MesEnum, example: 'FEBRERO' })
  @IsEnum(MesEnum)
  mes: MesEnum;

  @ApiProperty({ description: 'Año', example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number;
}

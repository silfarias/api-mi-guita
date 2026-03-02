import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class ReporteCategoriasQueryDto {
  @ApiProperty({ description: 'Mes', enum: MesEnum })
  @IsEnum(MesEnum)
  mes: MesEnum;

  @ApiProperty({ description: 'Año' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number;
}

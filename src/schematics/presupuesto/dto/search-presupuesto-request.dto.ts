import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class SearchPresupuestoRequestDto {
  @ApiProperty({ description: 'Mes', enum: MesEnum, required: false })
  @IsOptional()
  @IsEnum(MesEnum)
  mes?: MesEnum;

  @ApiProperty({ description: 'Año', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;
}

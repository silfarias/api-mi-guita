import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReporteEvolucionQueryDto {
  @ApiProperty({ description: 'Año', example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number;
}

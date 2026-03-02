import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class UpdatePresupuestoRequestDto {
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

  @ApiProperty({ description: 'Monto del presupuesto', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto?: number;
}

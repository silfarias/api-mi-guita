import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class CreatePresupuestoRequestDto {
  @ApiProperty({ description: 'ID de la categoría', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId: number;

  @ApiProperty({ description: 'Mes', enum: MesEnum, example: 'FEBRERO' })
  @IsNotEmpty()
  @IsEnum(MesEnum)
  mes: MesEnum;

  @ApiProperty({ description: 'Año', example: 2026 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio: number;

  @ApiProperty({ description: 'Monto del presupuesto', example: 80000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;
}

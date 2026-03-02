import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class PorMesRequestDto {

  @ApiProperty({
    description: 'Año',
    type: Number,
    required: true,
    example: 2026,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  anio: number;

  @ApiProperty({
    description: 'Mes',
    enum: MesEnum,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(MesEnum)
  mes: MesEnum;
}

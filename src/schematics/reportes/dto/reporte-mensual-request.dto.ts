import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { MesEnum } from 'src/common/enums/mes-enum';
import { Type } from 'class-transformer';

export class ReporteMensualRequestDto {
  @ApiProperty({ 
    description: 'Año del reporte', 
    type: Number, 
    nullable: false, 
    example: 2026 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  anio: number;

  @ApiProperty({ 
    description: 'Mes del reporte', 
    enum: MesEnum, 
    nullable: false, 
    example: MesEnum.FEBRERO 
  })
  @IsNotEmpty()
  @IsEnum(MesEnum)
  mes: MesEnum;
}

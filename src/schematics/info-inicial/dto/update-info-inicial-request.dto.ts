import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { MesEnum } from 'src/common/enums/mes-enum';
import { Type } from 'class-transformer';
import { MedioPagoMontoDto } from './medio-pago-monto.dto';

export class UpdateInfoInicialRequestDto {

  @ApiProperty({ 
    description: 'Año de la información inicial', 
    type: Number, 
    nullable: true, 
    example: 2026 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anio?: number;

  @ApiProperty({ 
    description: 'Mes de la información inicial', 
    enum: MesEnum, 
    nullable: true, 
    example: MesEnum.FEBRERO 
  })
  @IsOptional()
  @IsEnum(MesEnum)
  mes?: MesEnum;

  @ApiProperty({ 
    description: 'Array de medios de pago con sus montos iniciales (reemplaza los existentes)', 
    type: [MedioPagoMontoDto], 
    nullable: true,
    example: [
      { medioPagoId: 1, monto: 20000 },
      { medioPagoId: 2, monto: 30000 }
    ]
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un medio de pago con su monto' })
  @ValidateNested({ each: true })
  @Type(() => MedioPagoMontoDto)
  mediosPago?: MedioPagoMontoDto[];
}

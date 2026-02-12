import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { MesEnum } from 'src/common/enums/mes-enum';
import { Type } from 'class-transformer';
import { MedioPagoMontoRequestDto } from './medio-pago-monto.dto';

export class CreateInfoInicialRequestDto {

  @ApiProperty({ 
    description: 'Año de la información inicial', 
    type: Number, 
    nullable: false, 
    example: 2026 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  anio: number;

  @ApiProperty({ 
    description: 'Mes de la información inicial', 
    enum: MesEnum, 
    nullable: false, 
    example: MesEnum.FEBRERO 
  })
  @IsNotEmpty()
  @IsEnum(MesEnum)
  mes: MesEnum;

  @ApiProperty({ 
    description: 'Array de medios de pago con sus montos iniciales', 
    type: [MedioPagoMontoRequestDto], 
    nullable: false,
    example: [
      { medioPagoId: 1, monto: 20000 },
      { medioPagoId: 2, monto: 30000 }
    ]
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un medio de pago con su monto' })
  @ValidateNested({ each: true })
  @Type(() => MedioPagoMontoRequestDto)
  mediosPago: MedioPagoMontoRequestDto[];
}

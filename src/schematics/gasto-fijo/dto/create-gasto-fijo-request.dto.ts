import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGastoFijoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del gasto fijo', 
    type: String, 
    required: true, 
    example: 'Internet/WiFi' 
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Monto del gasto fijo', 
    type: Number, 
    required: false, 
    example: 5000.00
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montoFijo?: number;

  @ApiProperty({ 
    description: 'ID de la categoría del gasto fijo', 
    type: Number, 
    required: true, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoriaId: number;

  @ApiProperty({ 
    description: 'Indica si el gasto fijo es un debito automatico', 
    type: Boolean, 
    required: true, 
    example: true 
  })
  @IsNotEmpty()
  @IsBoolean()
  esDebitoAutomatico: boolean;

  @ApiProperty({ description: 'Si es debito automatico, se debe proporcionar el id del medio de pago'})
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  medioPagoId?: number;
}
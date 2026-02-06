import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
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
}

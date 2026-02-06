import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGastoFijoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del gasto fijo', 
    type: String, 
    nullable: false, 
    example: 'Internet/WiFi' 
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ 
    description: 'Monto del gasto fijo', 
    type: Number, 
    nullable: false, 
    example: 5000.00,
    minimum: 0.01
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ 
    description: 'ID de la categoría del gasto fijo', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoriaId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGastoFijoRequestDto {

  @ApiProperty({ 
    description: 'Nombre del gasto fijo', 
    type: String, 
    nullable: true, 
    example: 'Internet/WiFi' 
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ 
    description: 'Monto del gasto fijo', 
    type: Number, 
    nullable: true, 
    example: 5000.00,
    minimum: 0.01
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto?: number;

  @ApiProperty({ 
    description: 'ID de la categoría del gasto fijo', 
    type: Number, 
    nullable: true, 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;
}

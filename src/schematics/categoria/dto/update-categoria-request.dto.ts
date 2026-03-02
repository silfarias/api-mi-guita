import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, MaxLength } from 'class-validator';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';

export class UpdateCategoriaRequestDto {

  @ApiProperty({ 
    description: 'Nombre de la categoría', 
    type: String, 
    nullable: true, 
    example: 'Alimentación' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({ 
    description: 'Tipo de categoría (INGRESO o EGRESO)', 
    enum: TipoCategoriaEnum, 
    nullable: true 
  })
  @IsOptional()
  @IsEnum(TipoCategoriaEnum)
  tipo?: TipoCategoriaEnum;

  @ApiProperty({ 
    description: 'Descripción de la categoría', 
    type: String, 
    nullable: true, 
    example: 'Gastos relacionados con comida y bebida' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiProperty({ 
    description: 'Color de la categoría (hexadecimal)', 
    type: String, 
    nullable: true, 
    example: '#FF5733' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({ 
    description: 'Icono de la categoría', 
    type: String, 
    nullable: true, 
    example: 'restaurant' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icono?: string;

  @ApiProperty({ 
    description: 'Estado activo de la categoría', 
    type: Boolean, 
    nullable: true, 
    example: true 
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

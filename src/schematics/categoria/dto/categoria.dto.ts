import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose } from 'class-transformer';

export class CategoriaDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre de la categoría', example: 'Alimentación' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Descripción de la categoría', example: 'Gastos relacionados con comida y bebida', required: false })
  @Expose()
  descripcion: string | null;

  @ApiProperty({ description: 'Color de la categoría', example: '#FF5733', required: false })
  @Expose()
  color: string | null;

  @ApiProperty({ description: 'Icono de la categoría', example: 'restaurant', required: false })
  @Expose()
  icono: string | null;

  @ApiProperty({ description: 'Estado activo de la categoría', example: true })
  @Expose()
  activo: boolean;
}

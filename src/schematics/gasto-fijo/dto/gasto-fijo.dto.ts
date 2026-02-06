import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { CategoriaDTO } from 'src/schematics/categoria/dto/categoria.dto';

export class GastoFijoDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre del gasto fijo', example: 'Internet/WiFi' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Monto del gasto fijo', example: 5000.00 })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Categoría del gasto fijo', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;
}

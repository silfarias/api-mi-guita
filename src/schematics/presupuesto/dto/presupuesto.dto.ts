import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';

export class PresupuestoDTO extends CommonDTO {
  @ApiProperty({ description: 'ID de la categoría' })
  @Expose()
  categoriaId: number;

  @ApiProperty({ description: 'Nombre de la categoría' })
  @Expose()
  categoriaNombre: string;

  @ApiProperty({ description: 'Mes', enum: MesEnum })
  @Expose()
  mes: MesEnum;

  @ApiProperty({ description: 'Año' })
  @Expose()
  anio: number;

  @ApiProperty({ description: 'Monto del presupuesto' })
  @Expose()
  monto: number;
}

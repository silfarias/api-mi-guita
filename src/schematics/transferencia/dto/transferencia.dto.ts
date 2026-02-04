import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MovimientoDTO } from 'src/schematics/movimiento/dto/movimiento.dto';

export class TransferenciaDTO {
  @ApiProperty({ description: 'Movimiento de egreso (origen)', type: () => MovimientoDTO })
  @Expose()
  @Type(() => MovimientoDTO)
  movimientoEgreso: MovimientoDTO;

  @ApiProperty({ description: 'Movimiento de ingreso (destino)', type: () => MovimientoDTO })
  @Expose()
  @Type(() => MovimientoDTO)
  movimientoIngreso: MovimientoDTO;

  @ApiProperty({ description: 'Monto transferido', example: 5000 })
  @Expose()
  monto: number;
}

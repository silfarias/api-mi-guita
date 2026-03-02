import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CuentaDTO } from 'src/schematics/cuenta/dto/cuenta.dto';

export class TransferenciaDTO {
  @ApiProperty({ description: 'ID de la transferencia' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Cuenta origen', type: () => CuentaDTO })
  @Expose()
  @Type(() => CuentaDTO)
  cuentaOrigen: CuentaDTO;

  @ApiProperty({ description: 'Cuenta destino', type: () => CuentaDTO })
  @Expose()
  @Type(() => CuentaDTO)
  cuentaDestino: CuentaDTO;

  @ApiProperty({ description: 'Monto transferido', example: 5000 })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Fecha de la transferencia' })
  @Expose()
  fecha: Date;
}

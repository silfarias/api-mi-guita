import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose } from 'class-transformer';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';

export class CuentaDTO extends CommonDTO {
  @ApiProperty({ description: 'Nombre de la cuenta', example: 'Efectivo' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum })
  @Expose()
  tipo: TipoCuentaEnum;

  @ApiProperty({ description: 'Saldo actual de la cuenta', example: 50000 })
  @Expose()
  saldoActual: number;
}

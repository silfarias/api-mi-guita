import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose } from 'class-transformer';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';

export class CuentaDTO extends CommonDTO {
  @ApiProperty({ description: 'Nombre de la cuenta', type: String, required: true, example: 'Efectivo' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum, required: true })
  @Expose()
  tipo: TipoCuentaEnum;

  @ApiProperty({ description: 'Saldo actual de la cuenta', type: Number, required: true, example: 50000 })
  @Expose()
  saldoActual: number;
}

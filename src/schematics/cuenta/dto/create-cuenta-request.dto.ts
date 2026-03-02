import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min, IsOptional } from 'class-validator';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';
import { Type } from 'class-transformer';

export class CreateCuentaRequestDto {
  @ApiProperty({ description: 'Nombre de la cuenta', example: 'Mercado Pago' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum })
  @IsNotEmpty()
  @IsEnum(TipoCuentaEnum)
  tipo: TipoCuentaEnum;

  @ApiProperty({ description: 'Saldo inicial (opcional, default 0)', example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldoInicial?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCuentaRequestDto } from './create-cuenta-request.dto';

export class CreateCuentaBulkRequestDto {
  @ApiProperty({
    description: 'Array de cuentas a crear',
    type: [CreateCuentaRequestDto],
    nullable: false,
    example: [
      { nombre: 'Efectivo', tipo: 'EFECTIVO', saldoInicial: 0 },
      { nombre: 'Mercado Pago', tipo: 'BILLETERA', saldoInicial: 15000 },
      { nombre: 'Banco Nación', tipo: 'BANCO', saldoInicial: 50000 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una cuenta' })
  @ValidateNested({ each: true })
  @Type(() => CreateCuentaRequestDto)
  cuentas: CreateCuentaRequestDto[];
}

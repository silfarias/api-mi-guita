import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferenciaRequestDto {
  @ApiProperty({ 
    description: 'ID de la información inicial (mes) donde se realiza la transferencia', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  infoInicialId: number;

  @ApiProperty({ 
    description: 'ID del medio de pago origen (de donde se transfiere)', 
    type: Number, 
    nullable: false, 
    example: 1 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  medioPagoOrigenId: number;

  @ApiProperty({ 
    description: 'ID del medio de pago destino (hacia donde se transfiere)', 
    type: Number, 
    nullable: false, 
    example: 2 
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  medioPagoDestinoId: number;

  @ApiProperty({ 
    description: 'Monto a transferir', 
    type: Number, 
    nullable: false, 
    example: 5000,
    minimum: 0.01
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ 
    description: 'Descripción de la transferencia (opcional)', 
    type: String, 
    nullable: true, 
    example: 'Transferencia de efectivo a Mercado Pago' 
  })
  @IsString()
  descripcion?: string;
}

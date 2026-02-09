import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGastoFijoRequestDto } from './create-gasto-fijo-request.dto';

export class CreateGastoFijoBulkRequestDto {
  @ApiProperty({ 
    description: 'Array de gastos fijos a crear', 
    type: [CreateGastoFijoRequestDto], 
    nullable: false,
    example: [
      { nombre: 'Internet/WiFi', montoFijo: 5000.00, categoriaId: 1, esDebitoAutomatico: true, medioPagoId: 2 },
      { nombre: 'Luz', montoFijo: 3000.00, categoriaId: 2, esDebitoAutomatico: false }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un gasto fijo' })
  @ValidateNested({ each: true })
  @Type(() => CreateGastoFijoRequestDto)
  gastosFijos: CreateGastoFijoRequestDto[];
}

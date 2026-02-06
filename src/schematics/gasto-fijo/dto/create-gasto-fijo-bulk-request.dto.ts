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
      { nombre: 'Internet/WiFi', monto: 5000.00, categoriaId: 1 },
      { nombre: 'Luz', monto: 3000.00, categoriaId: 2 }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un gasto fijo' })
  @ValidateNested({ each: true })
  @Type(() => CreateGastoFijoRequestDto)
  gastosFijos: CreateGastoFijoRequestDto[];
}

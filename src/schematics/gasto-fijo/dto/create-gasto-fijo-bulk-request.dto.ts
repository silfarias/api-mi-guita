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
      { nombre: 'Internet/WiFi', tipo: 'FIJO', montoEstimado: 5000, diaVencimiento: '2026-03-01', categoriaId: 1, esDebitoAutomatico: false },
      { nombre: 'Luz', tipo: 'FIJO', montoEstimado: 3000, diaVencimiento: '2026-03-05', categoriaId: 2, esDebitoAutomatico: false },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un gasto fijo' })
  @ValidateNested({ each: true })
  @Type(() => CreateGastoFijoRequestDto)
  gastosFijos: CreateGastoFijoRequestDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CommonDTO {
  @ApiProperty({
    description: 'Id de la entidad a insertar/modificar',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  @Expose()
  id: number;
}

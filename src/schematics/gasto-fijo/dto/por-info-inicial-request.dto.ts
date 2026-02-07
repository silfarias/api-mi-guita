import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class PorInfoInicialRequestDto {
  @ApiProperty({
    description: 'ID de la información inicial (mes/año)',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'infoInicialId es requerido' })
  @Type(() => Number)
  @IsInt()
  infoInicialId: number;
}

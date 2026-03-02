import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoCuentaEnum } from 'src/common/enums/tipo-cuenta-enum';

export class UpdateCuentaRequestDto {
  @ApiProperty({ description: 'Nombre de la cuenta', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Tipo de cuenta', enum: TipoCuentaEnum, required: false })
  @IsOptional()
  @IsEnum(TipoCuentaEnum)
  tipo?: TipoCuentaEnum;
}

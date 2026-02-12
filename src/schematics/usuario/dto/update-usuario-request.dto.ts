import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UpdatePersonaRequestDto } from 'src/schematics/persona/dto/update-persona-request.dto';

export class UpdateUsuarioRequestDto extends UpdatePersonaRequestDto {

  @ApiProperty({ description: 'Nombre de usuario', type: String, required: false, example: 'usuario123' })
  @IsOptional()
  @IsString()
  nombreUsuario?: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, required: false, example: 'MiContraseña123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena?: string;

  @ApiProperty({ description: 'Email del usuario', type: String, required: false, example: 'usuario@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Estado activo del usuario', type: Boolean, required: false, example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
  
}
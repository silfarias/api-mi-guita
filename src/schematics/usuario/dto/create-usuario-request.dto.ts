import { IsNotEmpty, IsString, MinLength, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePersonaRequestDto } from 'src/schematics/persona/dto/create-persona-request.dto';

export class CreateUsuarioRequestDto extends CreatePersonaRequestDto {

  @ApiProperty({ description: 'Nombre de usuario', type: String, nullable: false, example: 'usuario123' })
  @IsNotEmpty()
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'MiContraseña123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;
}

export class CreateUsuarioWithPersonaIdRequestDto {

  @ApiProperty({ description: 'ID de la persona', type: Number, nullable: false, example: 1 })
  @IsNotEmpty()
  @IsNumber()
  personaId: number;

  @ApiProperty({ description: 'Nombre de usuario', type: String, nullable: false, example: 'usuario123' })
  @IsNotEmpty()
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'MiContraseña123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;
  
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail, IsNumber } from 'class-validator';
import { CreatePersonaRequestDto } from 'src/schematics/persona/dto/create-persona-request.dto';
import { Transform, Type } from 'class-transformer';

export class CreateUsuarioRequestDto extends CreatePersonaRequestDto {

  @ApiProperty({ description: 'Nombre de usuario', type: String, nullable: false, example: 'usuario123' })
  @IsNotEmpty()
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'MiContraseña123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

}

export class CreateUsuarioRequestDtoWithPersonaId {

  @ApiProperty({ description: 'ID de la persona', type: Number, nullable: false, example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @Transform(({ value }) => {
    // Si es una cadena, convertirla a número
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  }, { toClassOnly: true })
  personaId: number

  @ApiProperty({ description: 'Nombre de usuario', type: String, nullable: false, example: 'usuario123' })
  @IsNotEmpty()
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'MiContraseña123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

}
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';
import { CreatePersonaRequestDto } from 'src/schematics/persona/dto/create-persona-request.dto';

export class SignupRequestDto extends CreatePersonaRequestDto {

  @ApiProperty({ description: 'Nombre de usuario', type: String, nullable: false, example: 'juanperez123' })
  @IsNotEmpty()
  @IsString()
  nombreUsuario: string;

  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'mipassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'juanperez@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

}
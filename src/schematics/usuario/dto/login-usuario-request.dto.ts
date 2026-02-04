import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginUsuarioRequestDto {

    @ApiProperty({ 
        description: 'Email del usuario para iniciar sesión', 
        type: String, 
        required: true, 
        example: 'silfarias123' 
    })
    @IsNotEmpty()
    @IsString()
    nombreUsuario: string;

    @ApiProperty({ description: 'Contraseña del usuario', type: String, required: true, example: 'sfa140320', minLength: 6 })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    contrasena: string;
    
} 
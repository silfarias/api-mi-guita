import { ApiProperty } from '@nestjs/swagger';
import { UsuarioDTO } from '../../usuario/dto/usuario.dto';

export class LoginResponseDto {
    @ApiProperty({
        description: 'Token de acceso JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    access_token: string;

    @ApiProperty({
        description: 'Datos del usuario autenticado',
        type: UsuarioDTO,
    })
    usuario: UsuarioDTO;
} 
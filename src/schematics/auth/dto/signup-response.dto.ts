import { ApiProperty } from '@nestjs/swagger';
import { UsuarioDTO } from '../../usuario/dto/usuario.dto';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';

export class SignupResponseDto {

  @ApiProperty({ description: 'Token JWT de acceso', type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @Expose()
  access_token: string;

  @ApiProperty({ description: 'Información del usuario registrado', type: UsuarioDTO })
  @Expose()
  @Type(() => UsuarioDTO)
  usuario: UsuarioDTO;

  @ApiProperty({ description: 'Mensaje de confirmación', type: String, example: 'Usuario registrado y autenticado exitosamente' })
  @Expose()
  message: string;

}

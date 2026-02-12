import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { PersonaDTO } from 'src/schematics/persona/dto/persona.dto';

export class UsuarioDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre de usuario', type: String })
  @Expose()
  nombreUsuario: string;

  @ApiProperty({ description: 'Email del usuario', type: String })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Estado activo del usuario', type: Boolean, default: true })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Último acceso del usuario', type: Date })
  @Expose()
  ultimoAcceso?: Date;

  @ApiProperty({ description: 'Foto de perfil del usuario', type: String, required: false, example: 'https://example.com/foto-perfil.jpg' })
  @Expose()
  fotoPerfil?: string;

  @ApiProperty({ description: 'Persona del usuario', type: () => PersonaDTO })
  @Expose()
  @Type(() => PersonaDTO)
  persona: PersonaDTO;

}

export class UsuarioSimpleDTO {

  @ApiProperty({ description: 'ID del usuario', type: Number })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Nombre de usuario', type: String })
  @Expose()
  nombreUsuario: string;

  @ApiProperty({ description: 'Email del usuario', type: String })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Estado activo del usuario', type: Boolean })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Último acceso del usuario', type: Date })
  @Expose()
  ultimoAcceso?: Date;

}
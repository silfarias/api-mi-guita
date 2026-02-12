import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { UsuarioSimpleDTO } from 'src/schematics/usuario/dto/usuario.dto';

export class PersonaDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre de la persona', example: 'Juan' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Apellido de la persona', example: 'Pérez' })
  @Expose()
  apellido: string;

}
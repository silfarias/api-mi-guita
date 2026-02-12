import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { Usuario } from '../entities/usuario.entity';
import { PageDto } from 'src/common/dto/page.dto';
import { SearchUsuarioRequestDto } from '../dto/search-usuario-request.dto';

@Injectable()
export class UsuarioRepository extends Repository<Usuario> {
  constructor(private dataSource: DataSource) {
    super(Usuario, dataSource.createEntityManager());
  }

  async search(request: SearchUsuarioRequestDto): Promise<PageDto<Usuario>> {
    const queryBuilder: SelectQueryBuilder<Usuario> = this.createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.persona', 'persona');

    if (request.id) {
      queryBuilder.andWhere('usuario.id = :id', { id: request.id });
    }

    if (request.nombreUsuario) {
      queryBuilder.andWhere(
        'LOWER(usuario.nombreUsuario) LIKE LOWER(:nombreUsuario)',
        {
          nombreUsuario: `%${request.nombreUsuario}%`,
        },
      );
    }

    if (request.email) {
      queryBuilder.andWhere(
        'LOWER(usuario.email) LIKE LOWER(:email)',
        {
          email: `%${request.email}%`,
        },
      );
    }

    if (request.activo !== undefined) {
      queryBuilder.andWhere('usuario.activo = :activo', { activo: request.activo });
    }

    if (request.nombrePersona) {
      queryBuilder.andWhere(
        'LOWER(persona.nombre) LIKE LOWER(:nombrePersona)',
        {
          nombrePersona: `%${request.nombrePersona}%`,
        },
      );
    }
    if (request.apellidoPersona) {
      queryBuilder.andWhere(
        'LOWER(persona.apellido) LIKE LOWER(:apellidoPersona)',
        {
          apellidoPersona: `%${request.apellidoPersona}%`,
        },
      );
    }

    queryBuilder.orderBy('usuario.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Usuario>(list, count);
  }
}

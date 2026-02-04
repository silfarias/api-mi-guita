import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { SearchPersonaRequestDto } from '../dto/search-persona-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class PersonaRepository extends Repository<Persona> {
  constructor(private dataSource: DataSource) {
    super(Persona, dataSource.createEntityManager());
  }

  async search(request: SearchPersonaRequestDto): Promise<PageDto<Persona>> {
    const queryBuilder: SelectQueryBuilder<Persona> = this.createQueryBuilder(
      'persona',
    )
      .leftJoinAndSelect('persona.usuario', 'usuario');

    if (request.id) {
      queryBuilder.andWhere('persona.id = :id', { id: request.id });
    }

    if (request.nombre) {
      queryBuilder.andWhere(
        'LOWER(persona.nombre) LIKE LOWER(:nombre)',
        {
          nombre: `%${request.nombre}%`,
        },
      );
    }

    if (request.apellido) {
      queryBuilder.andWhere(
        'LOWER(persona.apellido) LIKE LOWER(:apellido)',
        {
          apellido: `%${request.apellido}%`,
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

    if (request.nombreUsuario) {
      queryBuilder.andWhere(
        'LOWER(usuario.nombreUsuario) LIKE LOWER(:nombreUsuario)',
        {
          nombreUsuario: `%${request.nombreUsuario}%`,
        },
      );
    }
    
    if (request.idUsuario) {
      queryBuilder.andWhere('usuario.id = :idUsuario', { idUsuario: request.idUsuario });
    }

    queryBuilder.orderBy('persona.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Persona>(list, count);
  }

  async findOneById(id: number): Promise<Persona> {
    const persona = await this.findOne({ where: { id: id } });
    if (!persona) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return persona;
  }
}

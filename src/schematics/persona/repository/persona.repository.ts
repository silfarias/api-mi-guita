import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { Persona } from '../entities/persona.entity';
import { SearchPersonaRequestDto } from '../dto/search-persona-request.dto';

@Injectable()
export class PersonaRepository extends Repository<Persona> {
  constructor(private dataSource: DataSource) {
    super(Persona, dataSource.createEntityManager());
  }

  async search(request: SearchPersonaRequestDto): Promise<PageDto<Persona>> {
    const queryBuilder: SelectQueryBuilder<Persona> = this.createQueryBuilder('persona');

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

    queryBuilder.orderBy('persona.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Persona>(list, count);
  }
}

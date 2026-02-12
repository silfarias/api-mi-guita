import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { Categoria } from '../entities/categoria.entity';
import { SearchCategoriaRequestDto } from '../dto/search-categoria-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class CategoriaRepository extends Repository<Categoria> {
  constructor(private dataSource: DataSource) {
    super(Categoria, dataSource.createEntityManager());
  }

  async search(request: SearchCategoriaRequestDto): Promise<PageDto<Categoria>> {
    const qb = this.createQueryBuilder('categoria');

    if (request.id != null) {
      qb.andWhere('categoria.id = :id', { id: request.id });
    }
    if (request.nombre) {
      qb.andWhere('LOWER(categoria.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${request.nombre}%`,
      });
    }
    if (request.activo !== undefined) {
      qb.andWhere('categoria.activo = :activo', { activo: request.activo });
    }

    qb.orderBy('categoria.nombre', 'ASC');

    const [list, count] = await qb
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Categoria>(list, count);
  }
}

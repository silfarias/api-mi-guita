import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Categoria } from '../entities/categoria.entity';
import { SearchCategoriaRequestDto } from '../dto/search-categoria-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class CategoriaRepository extends Repository<Categoria> {
  constructor(private dataSource: DataSource) {
    super(Categoria, dataSource.createEntityManager());
  }

  async search(request: SearchCategoriaRequestDto): Promise<PageDto<Categoria>> {
    const queryBuilder: SelectQueryBuilder<Categoria> = this.createQueryBuilder(
      'categoria',
    );

    if (request.id) {
      queryBuilder.andWhere('categoria.id = :id', { id: request.id });
    }

    if (request.nombre) {
      queryBuilder.andWhere(
        'LOWER(categoria.nombre) LIKE LOWER(:nombre)',
        {
          nombre: `%${request.nombre}%`,
        },
      );
    }

    if (request.activo !== undefined) {
      queryBuilder.andWhere('categoria.activo = :activo', { activo: request.activo });
    }

    queryBuilder.orderBy('categoria.nombre', 'ASC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Categoria>(list, count);
  }

  async findOneById(id: number): Promise<Categoria> {
    const categoria = await this.findOne({
      where: { id: id },
    });
    if (!categoria) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return categoria;
  }
}

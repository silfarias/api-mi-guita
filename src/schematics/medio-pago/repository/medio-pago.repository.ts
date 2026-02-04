import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { MedioPago } from '../entities/medio-pago.entity';
import { SearchMedioPagoRequestDto } from '../dto/search-medio-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class MedioPagoRepository extends Repository<MedioPago> {
  constructor(private dataSource: DataSource) {
    super(MedioPago, dataSource.createEntityManager());
  }

  async search(request: SearchMedioPagoRequestDto): Promise<PageDto<MedioPago>> {
    const queryBuilder: SelectQueryBuilder<MedioPago> = this.createQueryBuilder(
      'medioPago',
    );

    if (request.id) {
      queryBuilder.andWhere('medioPago.id = :id', { id: request.id });
    }

    if (request.nombre) {
      queryBuilder.andWhere(
        'LOWER(medioPago.nombre) LIKE LOWER(:nombre)',
        {
          nombre: `%${request.nombre}%`,
        },
      );
    }

    if (request.tipo) {
      queryBuilder.andWhere('medioPago.tipo = :tipo', { tipo: request.tipo });
    }

    queryBuilder.orderBy('medioPago.tipo', 'ASC');
    queryBuilder.addOrderBy('medioPago.nombre', 'ASC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<MedioPago>(list, count);
  }

  async findOneById(id: number): Promise<MedioPago> {
    const medioPago = await this.findOne({
      where: { id: id },
    });
    if (!medioPago) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return medioPago;
  }
}

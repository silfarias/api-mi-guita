import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { MedioPago } from '../entities/medio-pago.entity';
import { SearchMedioPagoRequestDto } from '../dto/search-medio-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class MedioPagoRepository extends Repository<MedioPago> {
  constructor(private dataSource: DataSource) {
    super(MedioPago, dataSource.createEntityManager());
  }

  async search(request: SearchMedioPagoRequestDto): Promise<PageDto<MedioPago>> {
    const qb = this.createQueryBuilder('medioPago');

    if (request.id != null) {
      qb.andWhere('medioPago.id = :id', { id: request.id });
    }
    if (request.nombre) {
      qb.andWhere('LOWER(medioPago.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${request.nombre}%`,
      });
    }
    if (request.tipo != null) {
      qb.andWhere('medioPago.tipo = :tipo', { tipo: request.tipo });
    }

    qb.orderBy('medioPago.tipo', 'ASC');
    qb.addOrderBy('medioPago.nombre', 'ASC');

    const [list, count] = await qb
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<MedioPago>(list, count);
  }
}

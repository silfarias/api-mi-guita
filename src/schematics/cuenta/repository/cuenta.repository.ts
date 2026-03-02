import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Cuenta } from '../entities/cuenta.entity';
import { SearchCuentaRequestDto } from '../dto/search-cuenta-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class CuentaRepository extends Repository<Cuenta> {
  constructor(private dataSource: DataSource) {
    super(Cuenta, dataSource.createEntityManager());
  }

  async search(request: SearchCuentaRequestDto, usuarioId: number): Promise<PageDto<Cuenta>> {
    const qb = this.createQueryBuilder('cuenta')
      .leftJoinAndSelect('cuenta.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId });

    if (request.id != null) {
      qb.andWhere('cuenta.id = :id', { id: request.id });
    }
    if (request.tipo != null) {
      qb.andWhere('cuenta.tipo = :tipo', { tipo: request.tipo });
    }

    qb.orderBy('cuenta.nombre', 'ASC');

    const [list, count] = await qb
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Cuenta>(list, count);
  }

  async sumSaldoByUsuario(usuarioId: number): Promise<number> {
    const qb = this.createQueryBuilder('cuenta')
      .leftJoin('cuenta.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .select('SUM(cuenta.saldoActual)', 'total');
    const raw = await qb.getRawOne<{ total: string }>();
    return Number(raw?.total ?? 0);
  }
}

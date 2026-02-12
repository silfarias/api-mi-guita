import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';

import { GastoFijo } from '../entities/gasto-fijo.entity';
import { SearchGastoFijoRequestDto } from '../dto/search-gasto-fijo-request.dto';

@Injectable()
export class GastoFijoRepository extends Repository<GastoFijo> {
  constructor(private dataSource: DataSource) {
    super(GastoFijo, dataSource.createEntityManager());
  }

  async search(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<PageDto<GastoFijo>> {
    const qb = this.createQueryBuilder('gastoFijo')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.medioPago', 'medioPago')
      .leftJoinAndSelect('gastoFijo.gastosFijosPagos', 'gastosFijosPagos')
      .leftJoinAndSelect('gastosFijosPagos.infoInicial', 'infoInicial')
      .where('usuario.id = :usuarioId', { usuarioId });

    if (request.id != null) qb.andWhere('gastoFijo.id = :id', { id: request.id });
    if (request.nombre) qb.andWhere('gastoFijo.nombre = :nombre', { nombre: request.nombre });
    if (request.categoriaId != null) qb.andWhere('categoria.id = :categoriaId', { categoriaId: request.categoriaId });
    if (request.activo !== undefined) qb.andWhere('gastoFijo.activo = :activo', { activo: request.activo });
    if (request.esDebitoAutomatico !== undefined) {
      qb.andWhere('gastoFijo.esDebitoAutomatico = :esDebitoAutomatico', { esDebitoAutomatico: request.esDebitoAutomatico });
    }
    if (request.medioPagoId !== undefined) qb.andWhere('medioPago.id = :medioPagoId', { medioPagoId: request.medioPagoId });

    qb.orderBy('gastoFijo.nombre', 'ASC');
    qb.addOrderBy('gastoFijo.id', 'DESC');

    const [list, count] = await qb.skip(request.getOffset()).take(request.getTake()).getManyAndCount();
    return new PageDto<GastoFijo>(list, count);
  }

  async getGastosFijosActivos(usuarioId: number): Promise<GastoFijo[]> {
    return this.createQueryBuilder('gastoFijo')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.medioPago', 'medioPago')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('gastoFijo.deleted_date IS NULL')
      .andWhere('gastoFijo.activo = :activo', { activo: true })
      .getMany();
  }
}

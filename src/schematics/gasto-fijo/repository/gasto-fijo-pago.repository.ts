import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';

import { GastoFijoPago } from '../entities/gasto-fijo-pago.entity';
import { SearchGastoFijoPagoRequestDto } from '../dto/search-gasto-fijo-pago-request.dto';

@Injectable()
export class GastoFijoPagoRepository extends Repository<GastoFijoPago> {
  constructor(private dataSource: DataSource) {
    super(GastoFijoPago, dataSource.createEntityManager());
  }

  async search(request: SearchGastoFijoPagoRequestDto, usuarioId: number): Promise<PageDto<GastoFijoPago>> {
    const qb = this.createQueryBuilder('gastoFijoPago')
      .leftJoinAndSelect('gastoFijoPago.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijoPago.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'infoInicialUsuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('infoInicialUsuario.id = :usuarioId', { usuarioId });

    if (request.id != null) qb.andWhere('gastoFijoPago.id = :id', { id: request.id });
    if (request.gastoFijoId != null) qb.andWhere('gastoFijo.id = :gastoFijoId', { gastoFijoId: request.gastoFijoId });
    if (request.infoInicialId != null) qb.andWhere('infoInicial.id = :infoInicialId', { infoInicialId: request.infoInicialId });
    if (request.pagado !== undefined) qb.andWhere('gastoFijoPago.pagado = :pagado', { pagado: request.pagado });

    qb.orderBy('infoInicial.anio', 'DESC');
    qb.addOrderBy('infoInicial.mes', 'DESC');
    qb.addOrderBy('gastoFijoPago.id', 'DESC');

    const [list, count] = await qb.skip(request.getOffset()).take(request.getTake()).getManyAndCount();
    return new PageDto<GastoFijoPago>(list, count);
  }

  async findByGastoFijoAndInfoInicial(gastoFijoId: number, infoInicialId: number): Promise<GastoFijoPago | null> {
    return this.findOne({
      where: { gastoFijo: { id: gastoFijoId }, infoInicial: { id: infoInicialId } },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });
  }

  async getGastosFijosIdsConPago(infoInicialId: number): Promise<number[]> {
    const pagos = await this.createQueryBuilder('gastoFijoPago')
      .leftJoin('gastoFijoPago.gastoFijo', 'gastoFijo')
      .where('gastoFijoPago.infoInicial = :infoInicialId', { infoInicialId })
      .getMany();
    return pagos.map((p) => p.gastoFijo?.id).filter((id): id is number => id != null);
  }

  async findByInfoInicialIdAndUsuario(infoInicialId: number, usuarioId: number): Promise<GastoFijoPago[]> {
    return this.createQueryBuilder('gastoFijoPago')
      .leftJoinAndSelect('gastoFijoPago.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijoPago.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'infoInicialUsuario')
      .leftJoinAndSelect('infoInicial.infoInicialMedioPagos', 'infoInicialMedioPagos')
      .leftJoinAndSelect('infoInicialMedioPagos.medioPago', 'medioPago')
      .where('infoInicial.id = :infoInicialId', { infoInicialId })
      .andWhere('usuario.id = :usuarioId', { usuarioId })
      .orderBy('gastoFijo.nombre', 'ASC')
      .getMany();
  }
}

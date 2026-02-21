import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';

import { PagoGastoFijo } from '../entities/pago-gasto-fijo.entity';
import { SearchPagoGastoFijoRequestDto } from '../dto/search-pago-gasto-fijo-request.dto';

@Injectable()
export class PagoGastoFijoRepository extends Repository<PagoGastoFijo> {
  constructor(private dataSource: DataSource) {
    super(PagoGastoFijo, dataSource.createEntityManager());
  }

  async search(request: SearchPagoGastoFijoRequestDto, usuarioId: number): Promise<PageDto<PagoGastoFijo>> {
    const qb = this.createQueryBuilder('pagoGastoFijo')
      .leftJoinAndSelect('pagoGastoFijo.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('pagoGastoFijo.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'infoInicialUsuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('infoInicialUsuario.id = :usuarioId', { usuarioId });

    if (request.id != null) qb.andWhere('pagoGastoFijo.id = :id', { id: request.id });
    if (request.gastoFijoId != null) qb.andWhere('gastoFijo.id = :gastoFijoId', { gastoFijoId: request.gastoFijoId });
    if (request.infoInicialId != null) qb.andWhere('infoInicial.id = :infoInicialId', { infoInicialId: request.infoInicialId });
    if (request.pagado !== undefined) qb.andWhere('pagoGastoFijo.pagado = :pagado', { pagado: request.pagado });

    qb.orderBy('infoInicial.anio', 'DESC');
    qb.addOrderBy('infoInicial.mes', 'DESC');
    qb.addOrderBy('pagoGastoFijo.id', 'DESC');

    const [list, count] = await qb.skip(request.getOffset()).take(request.getTake()).getManyAndCount();
    return new PageDto<PagoGastoFijo>(list, count);
  }

  async findByGastoFijoAndInfoInicial(gastoFijoId: number, infoInicialId: number): Promise<PagoGastoFijo | null> {
    return this.findOne({
      where: { gastoFijo: { id: gastoFijoId }, infoInicial: { id: infoInicialId } },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });
  }

  async getGastosFijosIdsConPago(infoInicialId: number): Promise<number[]> {
    const pagos = await this.createQueryBuilder('pagoGastoFijo')
      .leftJoin('pagoGastoFijo.gastoFijo', 'gastoFijo')
      .where('pagoGastoFijo.infoInicial = :infoInicialId', { infoInicialId })
      .getMany();
    return pagos.map((p) => p.gastoFijo?.id).filter((id): id is number => id != null);
  }

  async findByInfoInicialIdAndUsuario(infoInicialId: number, usuarioId: number): Promise<PagoGastoFijo[]> {
    return this.createQueryBuilder('pagoGastoFijo')
      .leftJoinAndSelect('pagoGastoFijo.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('pagoGastoFijo.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'infoInicialUsuario')
      .leftJoinAndSelect('infoInicial.infoInicialMedioPagos', 'infoInicialMedioPagos')
      .leftJoinAndSelect('infoInicialMedioPagos.medioPago', 'medioPago')
      .where('infoInicial.id = :infoInicialId', { infoInicialId })
      .andWhere('usuario.id = :usuarioId', { usuarioId })
      .orderBy('gastoFijo.nombre', 'ASC')
      .getMany();
  }
}

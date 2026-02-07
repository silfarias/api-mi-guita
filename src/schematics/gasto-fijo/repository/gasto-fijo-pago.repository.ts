import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { GastoFijoPago } from '../entities/gasto-fijo-pago.entity';
import { SearchGastoFijoPagoRequestDto } from '../dto/search-gasto-fijo-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class GastoFijoPagoRepository extends Repository<GastoFijoPago> {
  constructor(private dataSource: DataSource) {
    super(GastoFijoPago, dataSource.createEntityManager());
  }

  async search(request: SearchGastoFijoPagoRequestDto, usuarioId: number): Promise<PageDto<GastoFijoPago>> {
    const queryBuilder: SelectQueryBuilder<GastoFijoPago> = this.createQueryBuilder(
      'gastoFijoPago',
    )
      .leftJoinAndSelect('gastoFijoPago.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijoPago.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'infoInicialUsuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('infoInicialUsuario.id = :usuarioId', { usuarioId });

    if (request.id) {
      queryBuilder.andWhere('gastoFijoPago.id = :id', { id: request.id });
    }

    if (request.gastoFijoId) {
      queryBuilder.andWhere('gastoFijo.id = :gastoFijoId', { gastoFijoId: request.gastoFijoId });
    }

    if (request.infoInicialId) {
      queryBuilder.andWhere('infoInicial.id = :infoInicialId', { infoInicialId: request.infoInicialId });
    }

    if (request.pagado !== undefined) {
      queryBuilder.andWhere('gastoFijoPago.pagado = :pagado', { pagado: request.pagado });
    }

    queryBuilder.orderBy('infoInicial.anio', 'DESC');
    queryBuilder.addOrderBy('infoInicial.mes', 'DESC');
    queryBuilder.addOrderBy('gastoFijoPago.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<GastoFijoPago>(list, count);
  }

  async findOneById(id: number): Promise<GastoFijoPago> {
    const gastoFijoPago = await this.findOne({
      where: { id: id },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });
    if (!gastoFijoPago) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return gastoFijoPago;
  }

  async findByGastoFijoAndInfoInicial(gastoFijoId: number, infoInicialId: number): Promise<GastoFijoPago | null> {
    return await this.findOne({
      where: {
        gastoFijo: { id: gastoFijoId },
        infoInicial: { id: infoInicialId },
      },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });
  }

  async getGastosFijosIdsConPago(infoInicialId: number): Promise<number[]> {
    const pagosExistentes = await this.createQueryBuilder('gastoFijoPago')
      .leftJoinAndSelect('gastoFijoPago.gastoFijo', 'gastoFijo')
      .where('gastoFijoPago.infoInicial = :infoInicialId', { infoInicialId })
      .getMany();
    return pagosExistentes
      .map((p) => p.gastoFijo?.id)
      .filter((id): id is number => id != null);
  }

  async findByInfoInicialIdAndUsuario(
    infoInicialId: number,
    usuarioId: number,
  ): Promise<GastoFijoPago[]> {
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

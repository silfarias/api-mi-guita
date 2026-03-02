import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PageDto } from 'src/common/dto/page.dto';
import { PagoGastoFijo } from '../entities/pago-gasto-fijo.entity';
import { SearchPagoGastoFijoRequestDto } from '../dto/search-pago-gasto-fijo-request.dto';
import { MesEnum } from 'src/common/enums/mes-enum';

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
      .leftJoinAndSelect('pagoGastoFijo.movimimiento', 'movimiento')
      .leftJoinAndSelect('pagoGastoFijo.usuario', 'pagoUsuario')
      .where('usuario.id = :usuarioId', { usuarioId });

    if (request.id != null) qb.andWhere('pagoGastoFijo.id = :id', { id: request.id });
    if (request.gastoFijoId != null) qb.andWhere('gastoFijo.id = :gastoFijoId', { gastoFijoId: request.gastoFijoId });
    if (request.anio != null) qb.andWhere('pagoGastoFijo.anio = :anio', { anio: request.anio });
    if (request.mes != null) qb.andWhere('pagoGastoFijo.mes = :mes', { mes: request.mes });
    if (request.pagado !== undefined) qb.andWhere('pagoGastoFijo.pagado = :pagado', { pagado: request.pagado });

    qb.orderBy('pagoGastoFijo.anio', 'DESC');
    qb.addOrderBy('pagoGastoFijo.mes', 'DESC');
    qb.addOrderBy('pagoGastoFijo.id', 'DESC');

    const [list, count] = await qb.skip(request.getOffset()).take(request.getTake()).getManyAndCount();
    return new PageDto<PagoGastoFijo>(list, count);
  }

  async findByGastoFijoAndMesAnio(
    gastoFijoId: number,
    anio: number,
    mes: MesEnum,
  ): Promise<PagoGastoFijo | null> {
    return this.findOne({
      where: { gastoFijo: { id: gastoFijoId }, anio, mes },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'movimimiento', 'usuario'],
    });
  }

  async getGastosFijosIdsConPago(anio: number, mes: MesEnum): Promise<number[]> {
    const pagos = await this.createQueryBuilder('pagoGastoFijo')
      .leftJoin('pagoGastoFijo.gastoFijo', 'gastoFijo')
      .where('pagoGastoFijo.anio = :anio', { anio })
      .andWhere('pagoGastoFijo.mes = :mes', { mes })
      .getMany();
    return pagos.map((p) => p.gastoFijo?.id).filter((id): id is number => id != null);
  }

  async findByMesAnioAndUsuario(anio: number, mes: MesEnum, usuarioId: number): Promise<PagoGastoFijo[]> {
    return this.createQueryBuilder('pagoGastoFijo')
      .leftJoinAndSelect('pagoGastoFijo.gastoFijo', 'gastoFijo')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('pagoGastoFijo.movimimiento', 'movimiento')
      .leftJoinAndSelect('pagoGastoFijo.usuario', 'pagoUsuario')
      .where('pagoGastoFijo.anio = :anio', { anio })
      .andWhere('pagoGastoFijo.mes = :mes', { mes })
      .andWhere('usuario.id = :usuarioId', { usuarioId })
      .orderBy('gastoFijo.nombre', 'ASC')
      .getMany();
  }
}

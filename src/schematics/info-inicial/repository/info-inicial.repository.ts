import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';

import { InfoInicial } from '../entities/info-inicial.entity';
import { SearchInfoInicialRequestDto } from '../dto/search-info-inicial-request.dto';

@Injectable()
export class InfoInicialRepository extends Repository<InfoInicial> {
  constructor(private dataSource: DataSource) {
    super(InfoInicial, dataSource.createEntityManager());
  }

  async search(request: SearchInfoInicialRequestDto): Promise<PageDto<InfoInicial>> {
    const qb = this.createQueryBuilder('infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'usuario')
      .leftJoinAndSelect('infoInicial.infoInicialMedioPagos', 'infoInicialMedioPagos')
      .leftJoinAndSelect('infoInicialMedioPagos.medioPago', 'medioPago');

    if (request.id != null) {
      qb.andWhere('infoInicial.id = :id', { id: request.id });
    }
    if (request.usuarioId != null) {
      qb.andWhere('usuario.id = :usuarioId', { usuarioId: request.usuarioId });
    }
    if (request.anio != null) {
      qb.andWhere('infoInicial.anio = :anio', { anio: request.anio });
    }
    if (request.mes != null) {
      qb.andWhere('infoInicial.mes = :mes', { mes: request.mes });
    }

    qb.orderBy('infoInicial.anio', 'DESC');
    qb.addOrderBy('infoInicial.mes', 'DESC');

    const [list, count] = await qb.skip(request.getOffset()).take(request.getTake()).getManyAndCount();
    return new PageDto<InfoInicial>(list, count);
  }

  async findByUsuarioAndMes(usuarioId: number, anio: number, mes: string): Promise<InfoInicial | null> {
    return this.findOne({
      where: {
        usuario: { id: usuarioId },
        anio,
        mes: mes as any,
      },
      relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });
  }
}

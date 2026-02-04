import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InfoInicial } from '../entities/info-inicial.entity';
import { SearchInfoInicialRequestDto } from '../dto/search-info-inicial-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class InfoInicialRepository extends Repository<InfoInicial> {
  constructor(private dataSource: DataSource) {
    super(InfoInicial, dataSource.createEntityManager());
  }

  async search(request: SearchInfoInicialRequestDto): Promise<PageDto<InfoInicial>> {
    const queryBuilder: SelectQueryBuilder<InfoInicial> = this.createQueryBuilder(
      'infoInicial',
    )
      .leftJoinAndSelect('infoInicial.usuario', 'usuario')
      .leftJoinAndSelect('infoInicial.infoInicialMedioPagos', 'infoInicialMedioPagos')
      .leftJoinAndSelect('infoInicialMedioPagos.medioPago', 'medioPago');

    if (request.id) {
      queryBuilder.andWhere('infoInicial.id = :id', { id: request.id });
    }

    if (request.usuarioId) {
      queryBuilder.andWhere('usuario.id = :usuarioId', { usuarioId: request.usuarioId });
    }

    if (request.anio) {
      queryBuilder.andWhere('infoInicial.anio = :anio', { anio: request.anio });
    }

    if (request.mes) {
      queryBuilder.andWhere('infoInicial.mes = :mes', { mes: request.mes });
    }

    queryBuilder.orderBy('infoInicial.anio', 'DESC');
    queryBuilder.addOrderBy('infoInicial.mes', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<InfoInicial>(list, count);
  }

  async findOneById(id: number): Promise<InfoInicial> {
    const infoInicial = await this.findOne({
      where: { id: id },
      relations: ['usuario', 'movimientos', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });
    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return infoInicial;
  }

  async findByUsuarioAndMes(usuarioId: number, anio: number, mes: string): Promise<InfoInicial | null> {
    return await this.findOne({
      where: {
        usuario: { id: usuarioId },
        anio: anio,
        mes: mes as any,
      },
      relations: ['usuario', 'movimientos', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });
  }
}

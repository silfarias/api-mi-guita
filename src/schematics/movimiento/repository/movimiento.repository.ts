import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Movimiento } from '../entities/movimiento.entity';
import { SearchMovimientoRequestDto } from '../dto/search-movimiento-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class MovimientoRepository extends Repository<Movimiento> {
  constructor(private dataSource: DataSource) {
    super(Movimiento, dataSource.createEntityManager());
  }

  async search(request: SearchMovimientoRequestDto, usuarioId?: number): Promise<PageDto<Movimiento>> {
    const queryBuilder: SelectQueryBuilder<Movimiento> = this.createQueryBuilder(
      'movimiento',
    )
      .leftJoinAndSelect('movimiento.infoInicial', 'infoInicial')
      .leftJoinAndSelect('infoInicial.usuario', 'usuario')
      .leftJoinAndSelect('infoInicial.infoInicialMedioPagos', 'infoInicialMedioPagos')
      .leftJoinAndSelect('infoInicialMedioPagos.medioPago', 'medioPagoInfo')
      .leftJoinAndSelect('movimiento.categoria', 'categoria')
      .leftJoinAndSelect('movimiento.medioPago', 'medioPago');

    // Filtrar por usuario si se proporciona
    if (usuarioId) {
      queryBuilder.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (request.id) {
      queryBuilder.andWhere('movimiento.id = :id', { id: request.id });
    }

    if (request.infoInicialId) {
      queryBuilder.andWhere('infoInicial.id = :infoInicialId', { infoInicialId: request.infoInicialId });
    }

    if (request.tipoMovimiento) {
      queryBuilder.andWhere('movimiento.tipoMovimiento = :tipoMovimiento', { tipoMovimiento: request.tipoMovimiento });
    }

    if (request.categoriaId) {
      queryBuilder.andWhere('categoria.id = :categoriaId', { categoriaId: request.categoriaId });
    }

    if (request.medioPagoId) {
      queryBuilder.andWhere('medioPago.id = :medioPagoId', { medioPagoId: request.medioPagoId });
    }

    if (request.fechaDesde) {
      queryBuilder.andWhere('movimiento.fecha >= :fechaDesde', { fechaDesde: request.fechaDesde });
    }

    if (request.fechaHasta) {
      queryBuilder.andWhere('movimiento.fecha <= :fechaHasta', { fechaHasta: request.fechaHasta });
    }

    queryBuilder.orderBy('movimiento.fecha', 'DESC');
    queryBuilder.addOrderBy('movimiento.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<Movimiento>(list, count);
  }

  async findOneById(id: number): Promise<Movimiento> {
    const movimiento = await this.findOne({
      where: { id: id },
      relations: ['infoInicial', 'infoInicial.usuario', 'categoria', 'medioPago'],
    });
    if (!movimiento) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return movimiento;
  }
}

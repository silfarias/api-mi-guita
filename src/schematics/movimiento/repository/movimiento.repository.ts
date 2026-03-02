import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Movimiento } from '../entities/movimiento.entity';
import { SearchMovimientoRequestDto } from '../dto/search-movimiento-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';

@Injectable()
export class MovimientoRepository extends Repository<Movimiento> {
  constructor(private dataSource: DataSource) {
    super(Movimiento, dataSource.createEntityManager());
  }

  async search(request: SearchMovimientoRequestDto, usuarioId?: number): Promise<PageDto<Movimiento>> {
    const queryBuilder: SelectQueryBuilder<Movimiento> = this.createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.cuenta', 'cuenta')
      .leftJoinAndSelect('cuenta.usuario', 'cuentaUsuario')
      .leftJoinAndSelect('movimiento.categoria', 'categoria')
      .leftJoinAndSelect('movimiento.usuario', 'usuario');

    if (usuarioId != null) {
      queryBuilder.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (request.id != null) {
      queryBuilder.andWhere('movimiento.id = :id', { id: request.id });
    }

    if (request.cuentaId != null) {
      queryBuilder.andWhere('cuenta.id = :cuentaId', { cuentaId: request.cuentaId });
    }

    if (request.tipoMovimiento != null) {
      queryBuilder.andWhere('movimiento.tipoMovimiento = :tipoMovimiento', {
        tipoMovimiento: request.tipoMovimiento,
      });
    }

    if (request.categoriaId != null) {
      queryBuilder.andWhere('categoria.id = :categoriaId', { categoriaId: request.categoriaId });
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
      where: { id },
      relations: ['cuenta', 'cuenta.usuario', 'categoria', 'usuario'],
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

  /** Ingresos y egresos del mes (solo INGRESO y EGRESO, sin transferencias ni saldo inicial) */
  async getResumenMes(
    usuarioId: number,
    mes: number,
    anio: number,
  ): Promise<{ ingresos: number; egresos: number }> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('MONTH(movimiento.fecha) = :mes', { mes })
      .andWhere('YEAR(movimiento.fecha) = :anio', { anio })
      .andWhere('movimiento.tipoMovimiento IN (:...tipos)', {
        tipos: [TipoMovimientoEnum.INGRESO, TipoMovimientoEnum.EGRESO],
      })
      .select(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'INGRESO' THEN movimiento.monto ELSE 0 END)`,
        'ingresos',
      )
      .addSelect(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'EGRESO' THEN movimiento.monto ELSE 0 END)`,
        'egresos',
      );
    const raw = await qb.getRawOne<{ ingresos: string; egresos: string }>();
    return {
      ingresos: Number(raw?.ingresos ?? 0),
      egresos: Number(raw?.egresos ?? 0),
    };
  }

  /** Gastos por categoría en el mes (solo EGRESO) */
  async getGastosPorCategoria(
    usuarioId: number,
    mes: number,
    anio: number,
  ): Promise<{ categoriaId: number; categoriaNombre: string; total: number }[]> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .leftJoin('movimiento.categoria', 'categoria')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('movimiento.tipoMovimiento = :tipo', {
        tipo: TipoMovimientoEnum.EGRESO,
      })
      .andWhere('MONTH(movimiento.fecha) = :mes', { mes })
      .andWhere('YEAR(movimiento.fecha) = :anio', { anio })
      .andWhere('categoria.id IS NOT NULL')
      .groupBy('categoria.id')
      .addGroupBy('categoria.nombre')
      .select('categoria.id', 'categoriaId')
      .addSelect('categoria.nombre', 'categoriaNombre')
      .addSelect('SUM(movimiento.monto)', 'total');
    const raw = await qb.getRawMany<{
      categoriaId: number;
      categoriaNombre: string;
      total: string;
    }>();
    return raw.map((r) => ({
      categoriaId: r.categoriaId,
      categoriaNombre: r.categoriaNombre,
      total: Number(r.total),
    }));
  }

  /** Gastos por cuenta en el mes (solo EGRESO) */
  async getGastosPorCuenta(
    usuarioId: number,
    mes: number,
    anio: number,
  ): Promise<{ cuentaId: number; cuentaNombre: string; total: number }[]> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .leftJoin('movimiento.cuenta', 'cuenta')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('movimiento.tipoMovimiento = :tipo', {
        tipo: TipoMovimientoEnum.EGRESO,
      })
      .andWhere('MONTH(movimiento.fecha) = :mes', { mes })
      .andWhere('YEAR(movimiento.fecha) = :anio', { anio })
      .groupBy('cuenta.id')
      .addGroupBy('cuenta.nombre')
      .select('cuenta.id', 'cuentaId')
      .addSelect('cuenta.nombre', 'cuentaNombre')
      .addSelect('SUM(movimiento.monto)', 'total');
    const raw = await qb.getRawMany<{
      cuentaId: number;
      cuentaNombre: string;
      total: string;
    }>();
    return raw.map((r) => ({
      cuentaId: r.cuentaId,
      cuentaNombre: r.cuentaNombre,
      total: Number(r.total),
    }));
  }

  /** Últimos N movimientos del usuario (para dashboard) */
  async getUltimosMovimientos(
    usuarioId: number,
    limit: number = 10,
  ): Promise<Movimiento[]> {
    return this.find({
      where: { usuario: { id: usuarioId } },
      relations: ['cuenta', 'categoria'],
      order: { fecha: 'DESC', id: 'DESC' },
      take: limit,
    });
  }

  /** Suma de egresos por categoría en el mes (para presupuestos) */
  async sumEgresosByCategoriaAndMesAnio(
    usuarioId: number,
    mes: number,
    anio: number,
  ): Promise<Map<number, number>> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .leftJoin('movimiento.categoria', 'categoria')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('movimiento.tipoMovimiento = :tipo', {
        tipo: TipoMovimientoEnum.EGRESO,
      })
      .andWhere('MONTH(movimiento.fecha) = :mes', { mes })
      .andWhere('YEAR(movimiento.fecha) = :anio', { anio })
      .andWhere('categoria.id IS NOT NULL')
      .groupBy('categoria.id')
      .select('categoria.id', 'categoriaId')
      .addSelect('SUM(movimiento.monto)', 'total');
    const raw = await qb.getRawMany<{ categoriaId: number; total: string }>();
    const map = new Map<number, number>();
    raw.forEach((r) => map.set(r.categoriaId, Number(r.total)));
    return map;
  }

  /** Ingresos y egresos por cuenta (para reportes). Si se pasan mes y anio, filtra por ese mes. */
  async getIngresosEgresosPorCuenta(
    usuarioId: number,
    mes?: number,
    anio?: number,
  ): Promise<
    { cuentaId: number; cuentaNombre: string; ingresos: number; egresos: number }[]
  > {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .leftJoin('movimiento.cuenta', 'cuenta')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('movimiento.tipoMovimiento IN (:...tipos)', {
        tipos: [TipoMovimientoEnum.INGRESO, TipoMovimientoEnum.EGRESO],
      });
    if (mes != null && anio != null) {
      qb.andWhere('MONTH(movimiento.fecha) = :mes', { mes });
      qb.andWhere('YEAR(movimiento.fecha) = :anio', { anio });
    }
    qb.groupBy('cuenta.id')
      .addGroupBy('cuenta.nombre')
      .select('cuenta.id', 'cuentaId')
      .addSelect('cuenta.nombre', 'cuentaNombre')
      .addSelect(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'INGRESO' THEN movimiento.monto ELSE 0 END)`,
        'ingresos',
      )
      .addSelect(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'EGRESO' THEN movimiento.monto ELSE 0 END)`,
        'egresos',
      );
    const raw = await qb.getRawMany<{
      cuentaId: number;
      cuentaNombre: string;
      ingresos: string;
      egresos: string;
    }>();
    return raw.map((r) => ({
      cuentaId: r.cuentaId,
      cuentaNombre: r.cuentaNombre,
      ingresos: Number(r.ingresos),
      egresos: Number(r.egresos),
    }));
  }

  /** Balance por mes del año (para reporte evolución) */
  async getBalancePorMes(
    usuarioId: number,
    anio: number,
  ): Promise<{ mes: number; mesNombre: string; balance: number }[]> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('YEAR(movimiento.fecha) = :anio', { anio })
      .andWhere('movimiento.tipoMovimiento IN (:...tipos)', {
        tipos: [TipoMovimientoEnum.INGRESO, TipoMovimientoEnum.EGRESO],
      })
      .groupBy('MONTH(movimiento.fecha)')
      .select('MONTH(movimiento.fecha)', 'mes')
      .addSelect(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'INGRESO' THEN movimiento.monto ELSE -movimiento.monto END)`,
        'balance',
      )
      .orderBy('mes', 'ASC');
    const raw = await qb.getRawMany<{ mes: number; balance: string }>();
    const nombres: Record<number, string> = {
      1: 'ENERO',
      2: 'FEBRERO',
      3: 'MARZO',
      4: 'ABRIL',
      5: 'MAYO',
      6: 'JUNIO',
      7: 'JULIO',
      8: 'AGOSTO',
      9: 'SEPTIEMBRE',
      10: 'OCTUBRE',
      11: 'NOVIEMBRE',
      12: 'DICIEMBRE',
    };
    return raw.map((r) => ({
      mes: r.mes,
      mesNombre: nombres[r.mes] ?? '',
      balance: Number(r.balance),
    }));
  }

  /** Flujo total: ingresos, egresos y balance. Opcionalmente por mes/año. */
  async getFlujo(
    usuarioId: number,
    mes?: number,
    anio?: number,
  ): Promise<{ ingresos: number; egresos: number; balance: number }> {
    const qb = this.createQueryBuilder('movimiento')
      .leftJoin('movimiento.usuario', 'usuario')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('movimiento.tipoMovimiento IN (:...tipos)', {
        tipos: [TipoMovimientoEnum.INGRESO, TipoMovimientoEnum.EGRESO],
      });
    if (mes != null && anio != null) {
      qb.andWhere('MONTH(movimiento.fecha) = :mes', { mes });
      qb.andWhere('YEAR(movimiento.fecha) = :anio', { anio });
    }
    qb.select(
      `SUM(CASE WHEN movimiento.tipoMovimiento = 'INGRESO' THEN movimiento.monto ELSE 0 END)`,
      'ingresos',
    )
      .addSelect(
        `SUM(CASE WHEN movimiento.tipoMovimiento = 'EGRESO' THEN movimiento.monto ELSE 0 END)`,
        'egresos',
      );
    const raw = await qb.getRawOne<{ ingresos: string; egresos: string }>();
    const ingresos = Number(raw?.ingresos ?? 0);
    const egresos = Number(raw?.egresos ?? 0);
    return { ingresos, egresos, balance: ingresos - egresos };
  }
}

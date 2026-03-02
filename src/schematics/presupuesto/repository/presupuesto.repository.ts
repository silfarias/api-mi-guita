import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Presupuesto } from '../entities/presupuesto.entity';

@Injectable()
export class PresupuestoRepository extends Repository<Presupuesto> {
  constructor(private dataSource: DataSource) {
    super(Presupuesto, dataSource.createEntityManager());
  }

  async findByUsuarioAndMesAnio(
    usuarioId: number,
    mes: string,
    anio: number,
  ): Promise<Presupuesto[]> {
    return this.find({
      where: { usuario: { id: usuarioId }, mes: mes as any, anio },
      relations: ['categoria', 'usuario'],
      order: { id: 'ASC' },
    });
  }

  async findOneByIdAndUsuario(id: number, usuarioId: number): Promise<Presupuesto> {
    const presupuesto = await this.findOne({
      where: { id, usuario: { id: usuarioId } },
      relations: ['categoria', 'usuario'],
    });
    if (!presupuesto) {
      throw new NotFoundException({
        code: 'RECORD_NOT_FOUND',
        message: 'Presupuesto no encontrado',
        details: JSON.stringify({ id }),
      });
    }
    return presupuesto;
  }

  async existsByUsuarioCategoriaMesAnio(
    usuarioId: number,
    categoriaId: number,
    mes: string,
    anio: number,
    excludeId?: number,
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('p')
      .leftJoin('p.usuario', 'u')
      .leftJoin('p.categoria', 'c')
      .where('u.id = :usuarioId', { usuarioId })
      .andWhere('c.id = :categoriaId', { categoriaId })
      .andWhere('p.mes = :mes', { mes })
      .andWhere('p.anio = :anio', { anio });
    if (excludeId != null) {
      qb.andWhere('p.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }
}

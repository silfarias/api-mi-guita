import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReporteMensualPorCategoria } from '../entities/reporte-mensual-por-categoria.entity';

@Injectable()
export class ReporteMensualPorCategoriaRepository extends Repository<ReporteMensualPorCategoria> {
  constructor(private dataSource: DataSource) {
    super(ReporteMensualPorCategoria, dataSource.createEntityManager());
  }

  async deleteByInfoInicialId(infoInicialId: number): Promise<void> {
    await this.delete({ infoInicial: { id: infoInicialId } });
  }
}

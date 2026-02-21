import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReporteMensualResumen } from '../entities/reporte-mensual-resumen.entity';

@Injectable()
export class ReporteMensualResumenRepository extends Repository<ReporteMensualResumen> {
  constructor(private dataSource: DataSource) {
    super(ReporteMensualResumen, dataSource.createEntityManager());
  }

  async findByInfoInicialId(infoInicialId: number): Promise<ReporteMensualResumen | null> {
    return this.findOne({
      where: { infoInicial: { id: infoInicialId } },
    });
  }

  async deleteByInfoInicialId(infoInicialId: number): Promise<void> {
    await this.delete({ infoInicial: { id: infoInicialId } });
  }
}

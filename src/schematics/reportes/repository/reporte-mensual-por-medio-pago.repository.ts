import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReporteMensualPorMedioPago } from '../entities/reporte-mensual-por-medio-pago.entity';

@Injectable()
export class ReporteMensualPorMedioPagoRepository extends Repository<ReporteMensualPorMedioPago> {
  constructor(private dataSource: DataSource) {
    super(ReporteMensualPorMedioPago, dataSource.createEntityManager());
  }

  async deleteByInfoInicialId(infoInicialId: number): Promise<void> {
    await this.delete({ infoInicial: { id: infoInicialId } });
  }
}

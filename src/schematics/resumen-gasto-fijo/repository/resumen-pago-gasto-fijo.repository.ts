import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ResumenPagoGastoFijo } from '../entities/resumen-pago-gasto-fijo.entity';

@Injectable()
export class ResumenPagoGastoFijoRepository extends Repository<ResumenPagoGastoFijo> {
  constructor(private dataSource: DataSource) {
    super(ResumenPagoGastoFijo, dataSource.createEntityManager());
  }

  async findByInfoInicialId(infoInicialId: number): Promise<ResumenPagoGastoFijo | null> {
    return await this.findOne({
      where: { infoInicial: { id: infoInicialId } },
      relations: ['infoInicial', 'usuario'],
    });
  }

  async findByUsuarioAndInfoInicial(usuarioId: number, infoInicialId: number): Promise<ResumenPagoGastoFijo | null> {
    return await this.findOne({
      where: {
        usuario: { id: usuarioId },
        infoInicial: { id: infoInicialId },
      },
      relations: ['infoInicial', 'usuario'],
    });
  }
}

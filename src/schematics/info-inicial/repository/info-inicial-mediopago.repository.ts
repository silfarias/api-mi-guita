import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InfoInicialMedioPago } from '../entities/info-inicial-mediopago.entity';

@Injectable()
export class InfoInicialMedioPagoRepository extends Repository<InfoInicialMedioPago> {
  constructor(private dataSource: DataSource) {
    super(InfoInicialMedioPago, dataSource.createEntityManager());
  }
}

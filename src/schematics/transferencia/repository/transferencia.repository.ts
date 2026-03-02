import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Transferencia } from '../entities/transferencia.entity';

@Injectable()
export class TransferenciaRepository extends Repository<Transferencia> {
  constructor(private dataSource: DataSource) {
    super(Transferencia, dataSource.createEntityManager());
  }
}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transferencia } from './entities/transferencia.entity';
import { TransferenciaController } from './transferencia.controller';
import { TransferenciaService } from './transferencia.service';
import { TransferenciaRepository } from './repository/transferencia.repository';
import { TransferenciaMapper } from './mappers/transferencia.mapper';
import { CuentaModule } from '../cuenta/cuenta.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transferencia]),
    forwardRef(() => CuentaModule),
  ],
  controllers: [TransferenciaController],
  providers: [TransferenciaService, TransferenciaRepository, TransferenciaMapper],
  exports: [TransferenciaService, TransferenciaRepository],
})
export class TransferenciaModule {}

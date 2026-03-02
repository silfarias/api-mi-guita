import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from './entities/presupuesto.entity';
import { PresupuestoController } from './presupuesto.controller';
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoRepository } from './repository/presupuesto.repository';
import { PresupuestoMapper } from './mappers/presupuesto.mapper';
import { SharedServicesModule } from 'src/common/shared-services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presupuesto]),
    SharedServicesModule,
  ],
  controllers: [PresupuestoController],
  providers: [PresupuestoService, PresupuestoRepository, PresupuestoMapper],
  exports: [PresupuestoService, PresupuestoRepository],
})
export class PresupuestoModule {}

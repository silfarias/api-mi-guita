import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CuentaModule } from '../cuenta/cuenta.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { PresupuestoModule } from '../presupuesto/presupuesto.module';

@Module({
  imports: [CuentaModule, MovimientoModule, PresupuestoModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

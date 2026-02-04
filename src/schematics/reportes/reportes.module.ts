import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { CategoriaModule } from '../categoria/categoria.module';

@Module({
  imports: [
    forwardRef(() => InfoInicialModule),
    forwardRef(() => MovimientoModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => CategoriaModule),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}

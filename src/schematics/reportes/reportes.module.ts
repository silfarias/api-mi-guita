import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReporteMensualResumen } from './entities/reporte-mensual-resumen.entity';
import { ReporteMensualPorMedioPago } from './entities/reporte-mensual-por-medio-pago.entity';
import { ReporteMensualPorCategoria } from './entities/reporte-mensual-por-categoria.entity';
import { ReporteMensualResumenRepository } from './repository/reporte-mensual-resumen.repository';
import { ReporteMensualPorMedioPagoRepository } from './repository/reporte-mensual-por-medio-pago.repository';
import { ReporteMensualPorCategoriaRepository } from './repository/reporte-mensual-por-categoria.repository';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { CategoriaModule } from '../categoria/categoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReporteMensualResumen,
      ReporteMensualPorMedioPago,
      ReporteMensualPorCategoria,
    ]),
    forwardRef(() => InfoInicialModule),
    forwardRef(() => MovimientoModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => CategoriaModule),
  ],
  controllers: [ReportesController],
  providers: [
    ReportesService,
    ReporteMensualResumenRepository,
    ReporteMensualPorMedioPagoRepository,
    ReporteMensualPorCategoriaRepository,
  ],
  exports: [ReportesService],
})
export class ReportesModule {}

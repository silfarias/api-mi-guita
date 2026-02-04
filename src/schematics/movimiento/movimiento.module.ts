import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { MovimientoMapper } from './mappers/movimiento.mapper';
import { MovimientoRepository } from './repository/movimiento.repository';
import { MovimientoController } from './movimiento.controller';
import { MovimientoService } from './movimiento.service';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { CategoriaModule } from '../categoria/categoria.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movimiento]),
    forwardRef(() => InfoInicialModule),
    forwardRef(() => CategoriaModule),
    forwardRef(() => MedioPagoModule),
  ],
  controllers: [MovimientoController],
  providers: [MovimientoService, MovimientoRepository, MovimientoMapper],
  exports: [MovimientoService, MovimientoRepository, MovimientoMapper],
})
export class MovimientoModule {}

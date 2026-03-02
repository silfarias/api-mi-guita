import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { MovimientoMapper } from './mappers/movimiento.mapper';
import { MovimientoRepository } from './repository/movimiento.repository';
import { MovimientoController } from './movimiento.controller';
import { MovimientoService } from './movimiento.service';
import { CuentaModule } from '../cuenta/cuenta.module';
import { CategoriaModule } from '../categoria/categoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movimiento]),
    forwardRef(() => CuentaModule),
    forwardRef(() => CategoriaModule),
  ],
  controllers: [MovimientoController],
  providers: [MovimientoService, MovimientoRepository, MovimientoMapper],
  exports: [MovimientoService, MovimientoRepository, MovimientoMapper],
})
export class MovimientoModule {}

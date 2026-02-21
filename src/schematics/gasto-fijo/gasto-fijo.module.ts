import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GastoFijo } from './entities/gasto-fijo.entity';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { GastoFijoController } from './gasto-fijo.controller';
import { GastoFijoService } from './gasto-fijo.service';

import { CategoriaModule } from '../categoria/categoria.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { PagoGastoFijoModule } from '../pagos-gasto-fijo/pago-gasto-fijo.module';

/**
 * Módulo de Gastos Fijos (cabecera).
 * Solo incluye la entidad GastoFijo y su CRUD.
 * Los pagos por mes están en PagoGastoFijoModule.
 * El resumen por información inicial está en resumen-gasto-fijo.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([GastoFijo]),
    forwardRef(() => CategoriaModule),
    forwardRef(() => UsuarioModule),
    forwardRef(() => InfoInicialModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => PagoGastoFijoModule),
  ],
  controllers: [GastoFijoController],
  providers: [GastoFijoService, GastoFijoRepository, GastoFijoMapper],
  exports: [GastoFijoService, GastoFijoRepository, GastoFijoMapper],
})
export class GastoFijoModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PagoGastoFijo } from './entities/pago-gasto-fijo.entity';
import { PagoGastoFijoController } from './pago-gasto-fijo.controller';
import { PagoGastoFijoService } from './pago-gasto-fijo.service';
import { PagoGastoFijoRepository } from './repository/pago-gasto-fijo.repository';
import { PagoGastoFijoMapper } from './mapper/pago-gasto-fijo.mapper';

import { GastoFijoModule } from '../gasto-fijo/gasto-fijo.module';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { ResumenPagoGastoFijoModule } from '../resumen-gasto-fijo/resumen-pago-gasto-fijo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoGastoFijo]),
    forwardRef(() => GastoFijoModule),
    forwardRef(() => ResumenPagoGastoFijoModule),
    forwardRef(() => InfoInicialModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => MovimientoModule),
  ],
  controllers: [PagoGastoFijoController],
  providers: [PagoGastoFijoService, PagoGastoFijoRepository, PagoGastoFijoMapper],
  exports: [PagoGastoFijoService, PagoGastoFijoRepository, PagoGastoFijoMapper],
})
export class PagoGastoFijoModule {}

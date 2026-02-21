import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ResumenPagoGastoFijo } from './entities/resumen-pago-gasto-fijo.entity';
import { ResumenPagoGastoFijoController } from './resumen-pago-gasto-fijo.controller';
import { ResumenPagoGastoFijoService } from './resumen-pago-gasto-fijo.service';
import { ResumenPagoGastoFijoRepository } from './repository/resumen-pago-gasto-fijo.repository';
import { ResumenPagoGastoFijoMapper } from './mapper/resumen-pago-gasto-fijo.mapper';

import { InfoInicialModule } from '../info-inicial/info-inicial.module';
import { PagoGastoFijoModule } from '../pagos-gasto-fijo/pago-gasto-fijo.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResumenPagoGastoFijo]),
    forwardRef(() => InfoInicialModule),
    forwardRef(() => PagoGastoFijoModule),
    forwardRef(() => UsuarioModule),
  ],
  controllers: [ResumenPagoGastoFijoController],
  providers: [
    ResumenPagoGastoFijoService,
    ResumenPagoGastoFijoRepository,
    ResumenPagoGastoFijoMapper,
  ],
  exports: [
    ResumenPagoGastoFijoService,
    ResumenPagoGastoFijoRepository,
    ResumenPagoGastoFijoMapper,
  ],
})
export class ResumenPagoGastoFijoModule {}

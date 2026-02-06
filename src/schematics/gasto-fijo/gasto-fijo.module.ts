import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoFijo } from './entities/gasto-fijo.entity';
import { GastoFijoPago } from './entities/gasto-fijo-pago.entity';
import { ResumenPagoGastoFijo } from './entities/resumen-pago-gasto-fijo.entity';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoPagoMapper } from './mappers/gasto-fijo-pago.mapper';
import { ResumenPagoGastoFijoMapper } from './mappers/resumen-pago-gasto-fijo.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { ResumenPagoGastoFijoRepository } from './repository/resumen-pago-gasto-fijo.repository';
import { GastoFijoController } from './gasto-fijo.controller';
import { GastoFijoPagoController } from './gasto-fijo-pago.controller';
import { ResumenPagoGastoFijoController } from './resumen-pago-gasto-fijo.controller';
import { GastoFijoService } from './gasto-fijo.service';
import { GastoFijoPagoService } from './gasto-fijo-pago.service';
import { ResumenPagoGastoFijoService } from './resumen-pago-gasto-fijo.service';
import { CategoriaModule } from '../categoria/categoria.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GastoFijo, GastoFijoPago, ResumenPagoGastoFijo]),
    forwardRef(() => CategoriaModule),
    forwardRef(() => UsuarioModule),
    forwardRef(() => InfoInicialModule),
  ],
  controllers: [GastoFijoController, GastoFijoPagoController, ResumenPagoGastoFijoController],
  providers: [
    GastoFijoService,
    GastoFijoPagoService,
    ResumenPagoGastoFijoService,
    GastoFijoRepository,
    GastoFijoPagoRepository,
    ResumenPagoGastoFijoRepository,
    GastoFijoMapper,
    GastoFijoPagoMapper,
    ResumenPagoGastoFijoMapper,
  ],
  exports: [
    GastoFijoService,
    GastoFijoPagoService,
    ResumenPagoGastoFijoService,
    GastoFijoRepository,
    GastoFijoPagoRepository,
    ResumenPagoGastoFijoRepository,
    GastoFijoMapper,
    GastoFijoPagoMapper,
    ResumenPagoGastoFijoMapper,
  ],
})
export class GastoFijoModule {}

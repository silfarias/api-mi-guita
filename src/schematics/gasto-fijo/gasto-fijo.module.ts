import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastoFijo } from './entities/gasto-fijo.entity';
import { GastoFijoPago } from './entities/gasto-fijo-pago.entity';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoPagoMapper } from './mappers/gasto-fijo-pago.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { GastoFijoController } from './gasto-fijo.controller';
import { GastoFijoPagoController } from './gasto-fijo-pago.controller';
import { GastoFijoService } from './gasto-fijo.service';
import { GastoFijoPagoService } from './gasto-fijo-pago.service';
import { CategoriaModule } from '../categoria/categoria.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { InfoInicialModule } from '../info-inicial/info-inicial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GastoFijo, GastoFijoPago]),
    forwardRef(() => CategoriaModule),
    forwardRef(() => UsuarioModule),
    forwardRef(() => InfoInicialModule),
  ],
  controllers: [GastoFijoController, GastoFijoPagoController],
  providers: [
    GastoFijoService,
    GastoFijoPagoService,
    GastoFijoRepository,
    GastoFijoPagoRepository,
    GastoFijoMapper,
    GastoFijoPagoMapper,
  ],
  exports: [
    GastoFijoService,
    GastoFijoPagoService,
    GastoFijoRepository,
    GastoFijoPagoRepository,
    GastoFijoMapper,
    GastoFijoPagoMapper,
  ],
})
export class GastoFijoModule {}

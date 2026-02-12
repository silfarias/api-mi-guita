import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

import { InfoInicial } from './entities/info-inicial.entity';
import { InfoInicialMedioPago } from './entities/info-inicial-mediopago.entity';
import { ResumenPagoGastoFijo } from '../gasto-fijo/entities/resumen-pago-gasto-fijo.entity';
import { InfoInicialMapper } from './mappers/info-inicial.mapper';
import { InfoInicialRepository } from './repository/info-inicial.repository';
import { InfoInicialMedioPagoRepository } from './repository/info-inicial-mediopago.repository';
import { InfoInicialController } from './info-inicial.controller';
import { InfoInicialService } from './info-inicial.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { GastoFijoModule } from '../gasto-fijo/gasto-fijo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfoInicial, InfoInicialMedioPago, ResumenPagoGastoFijo]),
    forwardRef(() => UsuarioModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => MovimientoModule),
    forwardRef(() => GastoFijoModule),
  ],
  controllers: [InfoInicialController],
  providers: [
    InfoInicialService,
    InfoInicialRepository,
    InfoInicialMedioPagoRepository,
    InfoInicialMapper,
    GetEntityService,
    ErrorHandlerService,
  ],
  exports: [InfoInicialService, InfoInicialRepository, InfoInicialMapper],
})
export class InfoInicialModule {}

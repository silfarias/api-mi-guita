import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoInicial } from './entities/info-inicial.entity';
import { InfoInicialMedioPago } from './entities/info-inicial-mediopago.entity';
import { InfoInicialMapper } from './mappers/info-inicial.mapper';
import { InfoInicialRepository } from './repository/info-inicial.repository';
import { InfoInicialMedioPagoRepository } from './repository/info-inicial-mediopago.repository';
import { InfoInicialController } from './info-inicial.controller';
import { InfoInicialService } from './info-inicial.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { MedioPagoModule } from '../medio-pago/medio-pago.module';
import { MovimientoModule } from '../movimiento/movimiento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfoInicial, InfoInicialMedioPago]),
    forwardRef(() => UsuarioModule),
    forwardRef(() => MedioPagoModule),
    forwardRef(() => MovimientoModule),
  ],
  controllers: [InfoInicialController],
  providers: [InfoInicialService, InfoInicialRepository, InfoInicialMedioPagoRepository, InfoInicialMapper],
  exports: [InfoInicialService, InfoInicialRepository, InfoInicialMapper],
})
export class InfoInicialModule {}

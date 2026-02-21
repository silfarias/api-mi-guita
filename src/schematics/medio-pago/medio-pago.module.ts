import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedioPago } from './entities/medio-pago.entity';
import { MedioPagoMapper } from './mappers/medio-pago.mapper';
import { MedioPagoRepository } from './repository/medio-pago.repository';
import { MedioPagoController } from './medio-pago.controller';
import { MedioPagoService } from './medio-pago.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedioPago])],
  controllers: [MedioPagoController],
  providers: [MedioPagoService, MedioPagoRepository, MedioPagoMapper],
  exports: [MedioPagoService, MedioPagoRepository, MedioPagoMapper],
})
export class MedioPagoModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuenta } from './entities/cuenta.entity';
import { CuentaController } from './cuenta.controller';
import { CuentaService } from './cuenta.service';
import { CuentaRepository } from './repository/cuenta.repository';
import { CuentaMapper } from './mappers/cuenta.mapper';
import { SaldoService } from './saldo.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { MovimientoModule } from '../movimiento/movimiento.module';
import { TransferenciaModule } from '../transferencia/transferencia.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cuenta]),
    forwardRef(() => UsuarioModule),
    forwardRef(() => MovimientoModule),
    forwardRef(() => TransferenciaModule),
  ],
  controllers: [CuentaController],
  providers: [CuentaService, CuentaRepository, CuentaMapper, SaldoService],
  exports: [CuentaService, CuentaRepository, CuentaMapper, SaldoService],
})
export class CuentaModule {}

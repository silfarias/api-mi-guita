import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuenta } from './entities/cuenta.entity';
import { CuentaController } from './cuenta.controller';
import { CuentaService } from './cuenta.service';
import { CuentaRepository } from './repository/cuenta.repository';
import { CuentaMapper } from './mappers/cuenta.mapper';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cuenta]),
    forwardRef(() => UsuarioModule),
  ],
  controllers: [CuentaController],
  providers: [CuentaService, CuentaRepository, CuentaMapper],
  exports: [CuentaService, CuentaRepository, CuentaMapper],
})
export class CuentaModule {}

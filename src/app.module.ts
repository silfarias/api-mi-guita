import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSourceConfigLocal } from './config/typeorm/data-source-local';
import { LoggingMiddleware } from './middlewares/log-middleware';
import { SharedServicesModule } from './common/shared-services.module';
import { EmailModule } from './common/email/email.module';
import { AuthModule } from './schematics/auth/auth.module';
import { UsuarioModule } from './schematics/usuario/usuario.module';
import { PersonaModule } from './schematics/persona/persona.module';
import { MovimientoModule } from './schematics/movimiento/movimiento.module';
import { CategoriaModule } from './schematics/categoria/categoria.module';
import { CuentaModule } from './schematics/cuenta/cuenta.module';
import { TransferenciaModule } from './schematics/transferencia/transferencia.module';
import { GastoFijoModule } from './schematics/gasto-fijo/gasto-fijo.module';
import { PagoGastoFijoModule } from './schematics/pagos-gasto-fijo/pago-gasto-fijo.module';
import { PresupuestoModule } from './schematics/presupuesto/presupuesto.module';
import { DashboardModule } from './schematics/dashboard/dashboard.module';
import { ReportesModule } from './schematics/reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      ...DataSourceConfigLocal,
    }),
    SharedServicesModule,
    EmailModule,
    AuthModule,
    PersonaModule,
    UsuarioModule,
    CuentaModule,
    MovimientoModule,
    CategoriaModule,
    TransferenciaModule,
    GastoFijoModule,
    PagoGastoFijoModule,
    PresupuestoModule,
    DashboardModule,
    ReportesModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSourceConfigLocal } from './config/typeorm/data-source-local';
import { LoggingMiddleware } from './middlewares/log-middleware';
import { SharedServicesModule } from './common/shared-services.module';
import { AuthModule } from './schematics/auth/auth.module';
import { UsuarioModule } from './schematics/usuario/usuario.module';
import { PersonaModule } from './schematics/persona/persona.module';
import { InfoInicialModule } from './schematics/info-inicial/info-inicial.module';
import { MovimientoModule } from './schematics/movimiento/movimiento.module';
import { CategoriaModule } from './schematics/categoria/categoria.module';
import { MedioPagoModule } from './schematics/medio-pago/medio-pago.module';
import { ReportesModule } from './schematics/reportes/reportes.module';
import { TransferenciaModule } from './schematics/transferencia/transferencia.module';
import { GastoFijoModule } from './schematics/gasto-fijo/gasto-fijo.module';

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
    AuthModule,
    PersonaModule,
    UsuarioModule,
    InfoInicialModule,
    MovimientoModule,
    CategoriaModule,
    MedioPagoModule,
    ReportesModule,
    TransferenciaModule,
    GastoFijoModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
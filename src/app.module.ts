import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSourceConfigLocal } from './config/typeorm/data-source-local';
import { LoggingMiddleware } from './middlewares/log-middleware';
import { AuthModule } from './schematics/auth/auth.module';
import { UsuarioModule } from './schematics/usuario/usuario.module';
import { PersonaModule } from './schematics/persona/persona.module';
import { InfoInicialModule } from './schematics/info-inicial/info-inicial.module';
import { MovimientoModule } from './schematics/movimiento/movimiento.module';
import { CategoriaModule } from './schematics/categoria/categoria.module';
import { MedioPagoModule } from './schematics/medio-pago/medio-pago.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: '.env' 
    }),
    TypeOrmModule.forRoot({
      ...DataSourceConfigLocal,
    }),
    AuthModule,
    PersonaModule,
    UsuarioModule,
    InfoInicialModule,
    MovimientoModule,
    CategoriaModule,
    MedioPagoModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
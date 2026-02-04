import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSourceConfigLocal } from './config/typeorm/data-source-local';
import { LoggingMiddleware } from './middlewares/log-middleware';
import { AuthModule } from './schematics/auth/auth.module';
import { UsuarioModule } from './schematics/usuario/usuario.module';
import { PersonaModule } from './schematics/persona/persona.module';

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
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
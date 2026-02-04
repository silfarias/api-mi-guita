import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { PersonaMapper } from './mappers/persona.mapper';
import { PersonaRepository } from './repository/persona.repository';
// import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';
import { AuthModule } from '../auth/auth.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsuarioModule),
  ],
  controllers: [],
  providers: [PersonaService, PersonaRepository, PersonaMapper],
  exports: [PersonaService, PersonaRepository, PersonaMapper],
})
export class PersonaModule { }

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from './entities/usuario.entity';
import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';

import { AuthModule } from '../auth/auth.module';
import { PersonaModule } from '../persona/persona.module';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    forwardRef(() => AuthModule),
    PersonaModule,
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, UsuarioRepository, UsuarioMapper, CloudinaryService],
  exports: [UsuarioService, UsuarioRepository, UsuarioMapper],
})
export class UsuarioModule { }

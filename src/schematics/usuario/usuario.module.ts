import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { AuthModule } from '../auth/auth.module';
import { PersonaMapper } from '../persona/mappers/persona.mapper';
import { PersonaRepository } from '../persona/repository/persona.repository';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, UsuarioRepository, UsuarioMapper, PersonaMapper, PersonaRepository, CloudinaryService],
  exports: [UsuarioService, UsuarioRepository, UsuarioMapper],
})
export class UsuarioModule { }

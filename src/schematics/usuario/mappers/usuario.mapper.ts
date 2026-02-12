import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';

import { PageDto } from 'src/common/dto/page.dto';

import { Usuario } from '../entities/usuario.entity';
import { UsuarioDTO } from '../dto/usuario.dto';
import { CreateUsuarioRequestDto, CreateUsuarioWithPersonaIdRequestDto } from '../dto/create-usuario-request.dto';
import { UpdateUsuarioRequestDto } from '../dto/update-usuario-request.dto';
import { SearchUsuarioRequestDto } from '../dto/search-usuario-request.dto';

import { Persona } from 'src/schematics/persona/entities/persona.entity';
import { PersonaMapper } from 'src/schematics/persona/mappers/persona.mapper';

@Injectable()
export class UsuarioMapper {
  constructor(private readonly personaMapper: PersonaMapper) {}

  async entity2DTO(usuario: Usuario): Promise<UsuarioDTO> {
    const dto = plainToInstance(UsuarioDTO, usuario, {
      excludeExtraneousValues: true,
    });
    if (usuario.persona) {
      dto.persona = await this.personaMapper.entity2DTO(usuario.persona);
    }
    return dto;
  }

  async page2Dto(
    request: SearchUsuarioRequestDto,
    page: PageDto<Usuario>,
  ): Promise<PageDto<UsuarioDTO>> {
    const dtos = await Promise.all(page.data.map((u) => this.entity2DTO(u)));
    const pageDto = new PageDto<UsuarioDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(
      request.getPageNumber(),
      request.getTake(),
    );
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(
    request: CreateUsuarioRequestDto,
  ): Promise<Usuario> {
    const usuario = new Usuario();
    usuario.nombreUsuario = request.nombreUsuario;
    usuario.email = request.email;
    usuario.contrasena = await bcrypt.hash(request.contrasena, 10);
    return usuario;
  }

  async createDTO2EntityWithPersonaId(
    request: CreateUsuarioWithPersonaIdRequestDto,
  ): Promise<Usuario> {
    const usuario = new Usuario();
    usuario.nombreUsuario = request.nombreUsuario;
    usuario.email = request.email;
    usuario.contrasena = await bcrypt.hash(request.contrasena, 10);
    usuario.persona = Persona.fromId(request.personaId);
    return usuario;
  }

  async updateDTO2Entity(
    usuario: Usuario,
    request: UpdateUsuarioRequestDto,
  ): Promise<Usuario> {
    if (request.nombreUsuario !== undefined) {
      usuario.nombreUsuario = request.nombreUsuario;
    }
    if (request.email !== undefined) {
      usuario.email = request.email;
    }
    if (request.contrasena != null && request.contrasena !== '') {
      usuario.contrasena = await bcrypt.hash(request.contrasena, 10);
    }
    return usuario;
  }
}
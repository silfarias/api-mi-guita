import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PageDto } from 'src/common/dto/page.dto';

import { Persona } from '../entities/persona.entity';

import { PersonaDTO } from '../dto/persona.dto';
import { CreatePersonaRequestDto } from '../dto/create-persona-request.dto';
import { UpdatePersonaRequestDto } from '../dto/update-persona-request.dto';
import { SearchPersonaRequestDto } from '../dto/search-persona-request.dto';

@Injectable()
export class PersonaMapper {

  async entity2DTO(persona: Persona): Promise<PersonaDTO> {
    return plainToInstance(PersonaDTO, persona, {
      excludeExtraneousValues: true,
    });
  }

  async page2Dto(
    request: SearchPersonaRequestDto,
    page: PageDto<Persona>,
  ): Promise<PageDto<PersonaDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (usuario) => {
        return this.entity2DTO(usuario);
      }),
    );
    const pageDto = new PageDto<PersonaDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(1, 10);
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(request: CreatePersonaRequestDto): Promise<Persona> {
    const newPersona: Persona = new Persona();
    newPersona.nombre = request.nombre;
    newPersona.apellido = request.apellido;
    return newPersona;
  }

  async updateDTO2Entity(
    editPersona: Persona,
    request: UpdatePersonaRequestDto,
  ): Promise<Persona> {
    if (request.nombre !== undefined) {
      editPersona.nombre = request.nombre;
    }
    if (request.apellido !== undefined) {
      editPersona.apellido = request.apellido;
    }
    return editPersona;
  }
}
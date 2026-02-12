import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

import { Persona } from './entities/persona.entity';
import { PersonaMapper } from './mappers/persona.mapper';
import { PersonaRepository } from './repository/persona.repository';

import { PersonaDTO } from './dto/persona.dto';
import { CreatePersonaRequestDto } from './dto/create-persona-request.dto';
import { UpdatePersonaRequestDto } from './dto/update-persona-request.dto';
import { SearchPersonaRequestDto } from './dto/search-persona-request.dto';


@Injectable()
export class PersonaService {
  constructor(
    private personaMapper: PersonaMapper,
    private personaRepository: PersonaRepository,
    private getEntityService: GetEntityService,
    private errorHandler: ErrorHandlerService,
  ) {}

  /** Busca una persona por criterio. Retorna null si no existe o no se pasa criterio. */
  async find(criteria?: FindOptionsWhere<Persona>): Promise<Persona | null> {
    if (criteria == null) return null;
    return this.getEntityService.findOneBy(Persona, criteria);
  }

  async findById(id: number): Promise<PersonaDTO> {
    try {
      const persona = await this.getEntityService.findById(Persona, id);
      return await this.personaMapper.entity2DTO(persona);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchPersonaRequestDto): Promise<PageDto<PersonaDTO>> {
    try {
      const personaPage = await this.personaRepository.search(request);
      return this.personaMapper.page2Dto(request, personaPage);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async create(request: CreatePersonaRequestDto): Promise<PersonaDTO> {
    try {
      const newPersona = await this.personaMapper.createDTO2Entity(request);
      const personaSaved = await this.personaRepository.save(newPersona);
      return this.personaMapper.entity2DTO(personaSaved);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdatePersonaRequestDto): Promise<PersonaDTO> {
    try {
      const persona = await this.getEntityService.findById(Persona, id);
      const updatePersona = await this.personaMapper.updateDTO2Entity(
        persona,
        request,
      );
      await this.personaRepository.save(updatePersona);
      return this.personaMapper.entity2DTO(updatePersona);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  /** Elimina una persona (soft delete). Para uso desde otros módulos (ej. Usuario). */
  async remove(id: number): Promise<void> {
    try {
      const persona = await this.getEntityService.findById(Persona, id);
      await this.personaRepository.softRemove(persona);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }
}
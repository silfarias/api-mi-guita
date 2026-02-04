import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';

import { CreatePersonaRequestDto } from './dto/create-persona-request.dto';
import { UpdatePersonaRequestDto } from './dto/update-persona-request.dto';
import { SearchPersonaRequestDto } from './dto/search-persona-request.dto';
import { PersonaDTO, PersonaEnrichedDTO } from './dto/persona.dto';

import { PersonaMapper } from './mappers/persona.mapper';
import { PersonaRepository } from './repository/persona.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { Persona } from './entities/persona.entity';
import { ERRORS } from 'src/common/errors/errors-codes';
import { UsuarioRepository } from '../usuario/repository/usuario.repository';


@Injectable()
export class PersonaService {
  constructor(
    private personaMapper: PersonaMapper,
    private personaRepository: PersonaRepository,
    @Inject(forwardRef(() => UsuarioRepository))
    private usuarioRepository: UsuarioRepository,
  ) { }

  async find(criteria?: any): Promise<Persona> {
    const persona = await this.personaRepository.findOne(criteria);
    if (!persona) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify(criteria),
      });
    }
    return persona;
  }

  async findOne(id: number): Promise<PersonaEnrichedDTO> {
    const persona = await this.personaRepository.findOne({
      where: { id: id },
      relations: ['usuario'],
    });

    if (!persona) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    return await this.personaMapper.entity2EnrichedDTO(persona);
  }

  async search(request: SearchPersonaRequestDto): Promise<PageDto<PersonaEnrichedDTO>> {
    const personaPage = await this.personaRepository.search(request);
    return this.personaMapper.page2Dto(request, personaPage);
  }

  async create(request: CreatePersonaRequestDto): Promise<PersonaDTO> {
    try {
      const newPersona = await this.personaMapper.createDTO2Entity(request);
      const personaSaved = await this.personaRepository.save(newPersona);

      // Buscar la persona guardada
      const searchPersona = await this.personaRepository.findOne({
        where: { id: personaSaved.id },
      });

      if (!searchPersona) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: personaSaved.id }),
        });
      }

      return this.personaMapper.entity2DTO(searchPersona);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async update(id: number, request: UpdatePersonaRequestDto): Promise<PersonaDTO> {
    try {
      const persona = await this.find({ where: { id: id } });

      const updatePersona = await this.personaMapper.updateDTO2Entity(
        persona,
        request,
      );
      await this.personaRepository.save(updatePersona);

      // Buscar la persona actualizada
      const searchPersona = await this.personaRepository.findOne({
        where: { id: id },
      });

      if (!searchPersona) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.personaMapper.entity2DTO(searchPersona);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async remove(id: number): Promise<string> {
    const persona = await this.find({ where: { id: id }, relations: ['usuario'] });
    
    // Eliminar el usuario asociado a la persona (soft delete)
    if (persona.usuario) {
      await this.usuarioRepository.softRemove(persona.usuario);
    }
    
    // Eliminar la persona (soft delete)
    await this.personaRepository.softRemove(persona);
    return 'Persona eliminada junto con su usuario asociado';
  }
}

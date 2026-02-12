import { Injectable, HttpException } from '@nestjs/common';

import { Categoria } from './entities/categoria.entity';
import { CategoriaMapper } from './mappers/categoria.mapper';
import { CategoriaRepository } from './repository/categoria.repository';

import { PageDto } from 'src/common/dto/page.dto';

import { CategoriaDTO } from './dto/categoria.dto';
import { CreateCategoriaRequestDto } from './dto/create-categoria-request.dto';
import { UpdateCategoriaRequestDto } from './dto/update-categoria-request.dto';
import { SearchCategoriaRequestDto } from './dto/search-categoria-request.dto';

import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class CategoriaService {
  constructor(
    private readonly categoriaMapper: CategoriaMapper,
    private readonly categoriaRepository: CategoriaRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findById(id: number): Promise<CategoriaDTO> {
    try {
      const categoria = await this.getEntityService.findById(Categoria, id);
      return this.categoriaMapper.entity2DTO(categoria);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchCategoriaRequestDto): Promise<PageDto<CategoriaDTO>> {
    try {
      const page = await this.categoriaRepository.search(request);
      return this.categoriaMapper.page2Dto(request, page);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async create(request: CreateCategoriaRequestDto): Promise<CategoriaDTO> {
    try {
      await this.validateUniqueNombre(request.nombre);

      const newCategoria = this.categoriaMapper.createDTO2Entity(request);
      const saved = await this.categoriaRepository.save(newCategoria);

      const withRelations = await this.getEntityService.findById(Categoria, saved.id);
      return this.categoriaMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdateCategoriaRequestDto): Promise<CategoriaDTO> {
    try {
      const categoria = await this.getEntityService.findById(Categoria, id);

      if (request.nombre !== undefined && request.nombre !== categoria.nombre) {
        await this.validateUniqueNombre(request.nombre);
      }

      const updated = this.categoriaMapper.updateDTO2Entity(categoria, request);
      await this.categoriaRepository.save(updated);

      const withRelations = await this.getEntityService.findById(Categoria, id);
      return this.categoriaMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number): Promise<string> {
    try {
      const categoria = await this.getEntityService.findById(Categoria, id);
      await this.categoriaRepository.softRemove(categoria);
      return 'Categoría eliminada correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  /** Alias para compatibilidad: obtener categoría por ID como DTO */
  findOne(id: number): Promise<CategoriaDTO> {
    return this.findById(id);
  }

  private async validateUniqueNombre(nombre: string): Promise<void> {
    const existing = await this.categoriaRepository.findOne({
      where: { nombre },
    });
    if (existing) {
      this.errorHandler.throwConflict(
        ERRORS.ENTITY.NAME_ALREADY_EXISTS,
        `La categoría "${nombre}" ya está registrada`,
      );
    }
  }
}

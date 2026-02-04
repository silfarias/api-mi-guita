import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoriaRequestDto } from './dto/create-categoria-request.dto';
import { UpdateCategoriaRequestDto } from './dto/update-categoria-request.dto';
import { SearchCategoriaRequestDto } from './dto/search-categoria-request.dto';
import { CategoriaDTO } from './dto/categoria.dto';
import { CategoriaMapper } from './mappers/categoria.mapper';
import { CategoriaRepository } from './repository/categoria.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class CategoriaService {
  constructor(
    private categoriaMapper: CategoriaMapper,
    private categoriaRepository: CategoriaRepository,
  ) {}

  async findOne(id: number): Promise<CategoriaDTO> {
    const categoria = await this.categoriaRepository.findOneById(id);
    return await this.categoriaMapper.entity2DTO(categoria);
  }

  async search(request: SearchCategoriaRequestDto): Promise<PageDto<CategoriaDTO>> {
    const categoriaPage = await this.categoriaRepository.search(request);
    return this.categoriaMapper.page2Dto(request, categoriaPage);
  }

  async create(request: CreateCategoriaRequestDto): Promise<CategoriaDTO> {
    try {
      // Validar que no exista una categoría con el mismo nombre
      const existingCategoria = await this.categoriaRepository.findOne({
        where: { nombre: request.nombre },
      });

      if (existingCategoria) {
        throw new BadRequestException({
          code: ERRORS.ENTITY.NAME_ALREADY_EXISTS.CODE,
          message: 'Ya existe una categoría con ese nombre',
          details: `La categoría "${request.nombre}" ya está registrada`,
        });
      }

      // Crear la categoría
      const newCategoria = this.categoriaMapper.createDTO2Entity(request);
      const categoriaSaved = await this.categoriaRepository.save(newCategoria);

      // Buscar la categoría guardada
      const searchCategoria = await this.categoriaRepository.findOne({
        where: { id: categoriaSaved.id },
      });

      if (!searchCategoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: categoriaSaved.id }),
        });
      }

      return this.categoriaMapper.entity2DTO(searchCategoria);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async update(
    id: number,
    request: UpdateCategoriaRequestDto,
  ): Promise<CategoriaDTO> {
    try {
      // Verificar que la categoría existe
      const categoria = await this.categoriaRepository.findOne({
        where: { id: id },
      });

      if (!categoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      // Si se está cambiando el nombre, validar que no exista otra categoría con ese nombre
      if (request.nombre && request.nombre !== categoria.nombre) {
        const existingCategoria = await this.categoriaRepository.findOne({
          where: { nombre: request.nombre },
        });

        if (existingCategoria) {
          throw new BadRequestException({
            code: ERRORS.ENTITY.NAME_ALREADY_EXISTS.CODE,
            message: 'Ya existe una categoría con ese nombre',
            details: `La categoría "${request.nombre}" ya está registrada`,
          });
        }
      }

      // Actualizar la categoría
      const updateCategoria = this.categoriaMapper.updateDTO2Entity(categoria, request);
      await this.categoriaRepository.save(updateCategoria);

      // Buscar la categoría actualizada
      const searchCategoria = await this.categoriaRepository.findOne({
        where: { id: id },
      });

      if (!searchCategoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.categoriaMapper.entity2DTO(searchCategoria);
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
    const categoria = await this.categoriaRepository.findOne({
      where: { id: id },
    });

    if (!categoria) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    await this.categoriaRepository.softRemove(categoria);
    return 'Categoría eliminada correctamente';
  }
}

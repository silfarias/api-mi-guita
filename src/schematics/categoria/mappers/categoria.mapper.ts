import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Categoria } from '../entities/categoria.entity';
import { CategoriaDTO } from '../dto/categoria.dto';
import { CreateCategoriaRequestDto } from '../dto/create-categoria-request.dto';
import { UpdateCategoriaRequestDto } from '../dto/update-categoria-request.dto';
import { SearchCategoriaRequestDto } from '../dto/search-categoria-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class CategoriaMapper {
  async entity2DTO(categoria: Categoria): Promise<CategoriaDTO> {
    return plainToInstance(CategoriaDTO, categoria, {
      excludeExtraneousValues: true,
    });
  }

  async page2Dto(
    request: SearchCategoriaRequestDto,
    page: PageDto<Categoria>,
  ): Promise<PageDto<CategoriaDTO>> {
    const dtos = await Promise.all(page.data.map((c) => this.entity2DTO(c)));
    const pageDto = new PageDto<CategoriaDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(request: CreateCategoriaRequestDto): Categoria {
    const newCategoria: Categoria = new Categoria();
    newCategoria.nombre = request.nombre;
    newCategoria.descripcion = request.descripcion || null;
    newCategoria.color = request.color || null;
    newCategoria.icono = request.icono || null;
    newCategoria.activo = request.activo !== undefined ? request.activo : true;
    return newCategoria;
  }

  updateDTO2Entity(
    categoria: Categoria,
    request: UpdateCategoriaRequestDto,
  ): Categoria {
    if (request.nombre !== undefined) {
      categoria.nombre = request.nombre;
    }
    if (request.descripcion !== undefined) {
      categoria.descripcion = request.descripcion;
    }
    if (request.color !== undefined) {
      categoria.color = request.color;
    }
    if (request.icono !== undefined) {
      categoria.icono = request.icono;
    }
    if (request.activo !== undefined) {
      categoria.activo = request.activo;
    }
    return categoria;
  }
}

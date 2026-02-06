import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { GastoFijoDTO } from '../dto/gasto-fijo.dto';
import { CreateGastoFijoRequestDto } from '../dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from '../dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from '../dto/search-gasto-fijo-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { CategoriaMapper } from 'src/schematics/categoria/mappers/categoria.mapper';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';

@Injectable()
export class GastoFijoMapper {
  constructor(
    private categoriaMapper: CategoriaMapper,
  ) {}

  async entity2DTO(gastoFijo: GastoFijo): Promise<GastoFijoDTO> {
    const dto = plainToInstance(GastoFijoDTO, gastoFijo, {
      excludeExtraneousValues: true,
    });
    
    if (gastoFijo.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(gastoFijo.categoria);
    }
    
    return dto;
  }

  async page2Dto(
    request: SearchGastoFijoRequestDto,
    page: PageDto<GastoFijo>,
  ): Promise<PageDto<GastoFijoDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (gastoFijo) => {
        return this.entity2DTO(gastoFijo);
      }),
    );
    const pageDto = new PageDto<GastoFijoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(
    request: CreateGastoFijoRequestDto,
    categoria: Categoria,
  ): GastoFijo {
    const newGastoFijo: GastoFijo = new GastoFijo();
    newGastoFijo.nombre = request.nombre;
    newGastoFijo.monto = request.monto;
    newGastoFijo.categoria = categoria;
    return newGastoFijo;
  }

  updateDTO2Entity(
    gastoFijo: GastoFijo,
    request: UpdateGastoFijoRequestDto,
    categoria?: Categoria,
  ): GastoFijo {
    if (request.nombre !== undefined) {
      gastoFijo.nombre = request.nombre;
    }
    if (request.monto !== undefined) {
      gastoFijo.monto = request.monto;
    }
    if (categoria !== undefined) {
      gastoFijo.categoria = categoria;
    }
    return gastoFijo;
  }
}

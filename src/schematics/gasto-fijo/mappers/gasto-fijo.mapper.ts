import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { GastoFijoDTO, MisGastosFijosDTO, MisGastosFijosResponseDTO } from '../dto/gasto-fijo.dto';
import { CreateGastoFijoRequestDto } from '../dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from '../dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from '../dto/search-gasto-fijo-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { CategoriaMapper } from 'src/schematics/categoria/mappers/categoria.mapper';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { UsuarioMapper } from 'src/schematics/usuario/mappers/usuario.mapper';
import { GastoFijoPagoMapper } from './gasto-fijo-pago.mapper';
import { PageMetadataDto } from 'src/common/dto/page-metadata.dto';

@Injectable()
export class GastoFijoMapper {
  constructor(
    private usuarioMapper: UsuarioMapper,
    private categoriaMapper: CategoriaMapper,

    @Inject(forwardRef(() => GastoFijoPagoMapper))
    private gastoFijoPagoMapper: GastoFijoPagoMapper,
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

  async entity2MisGastosFijosDto(gastoFijo: GastoFijo): Promise<MisGastosFijosDTO> {
    const dto = plainToInstance(MisGastosFijosDTO, gastoFijo, {
      excludeExtraneousValues: true,
    });
    if (gastoFijo.usuario) {
      dto.usuario = await this.usuarioMapper.entity2DTO(gastoFijo.usuario);
    }
    if (gastoFijo.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(gastoFijo.categoria);
    }
    if (gastoFijo.gastosFijosPagos && gastoFijo.gastosFijosPagos.length > 0) {
      dto.pagos = await Promise.all(
        gastoFijo.gastosFijosPagos.map(async (pago) => {
          return await this.gastoFijoPagoMapper.entity2DTO(pago);
        }),
      );
    } else {
      dto.pagos = [];
    }
    return dto;
  }

  async page2MisGastosFijosDto(
    request: SearchGastoFijoRequestDto,
    page: PageDto<GastoFijo>,
  ): Promise<PageDto<MisGastosFijosDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (gastoFijo) => {
        return this.entity2MisGastosFijosDto(gastoFijo);
      }),
    );
    const pageDto = new PageDto<MisGastosFijosDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async page2MisGastosFijosResponseDto(
    request: SearchGastoFijoRequestDto,
    page: PageDto<GastoFijo>,
    usuario: any,
  ): Promise<MisGastosFijosResponseDTO> {
    const usuarioDTO = await this.usuarioMapper.entity2DTO(usuario);
    const gastosFijos = await Promise.all(
      page.data.map(async (gastoFijo) => this.entity2DTO(gastoFijo)),
    );
    const metadata = new PageMetadataDto(page.metadata.count);
    metadata.setPaginationData(request.getPageNumber(), request.getTake());
    metadata.sortBy = request.sortBy;

    const response = new MisGastosFijosResponseDTO();
    response.usuario = usuarioDTO;
    response.gastosFijos = gastosFijos;
    response.metadata = metadata;

    return response;
  }

  createDTO2Entity(
    request: CreateGastoFijoRequestDto,
    categoria: Categoria,
  ): GastoFijo {
    const newGastoFijo: GastoFijo = new GastoFijo();
    newGastoFijo.nombre = request.nombre;
    newGastoFijo.montoFijo = request.montoFijo != null ? request.montoFijo : null;
    newGastoFijo.activo = true; // por defecto activo al crear
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
    if (request.montoFijo !== undefined) {
      gastoFijo.montoFijo = request.montoFijo;
    }
    if (request.activo !== undefined) {
      gastoFijo.activo = request.activo;
    }
    if (categoria !== undefined) {
      gastoFijo.categoria = categoria;
    }
    return gastoFijo;
  }
}

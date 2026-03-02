import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { GastoFijoDTO, MisGastosFijosResponseDTO } from '../dto/gasto-fijo.dto';
import { CreateGastoFijoRequestDto } from '../dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from '../dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from '../dto/search-gasto-fijo-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { CategoriaMapper } from 'src/schematics/categoria/mappers/categoria.mapper';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { UsuarioMapper } from 'src/schematics/usuario/mappers/usuario.mapper';
import { PageMetadataDto } from 'src/common/dto/page-metadata.dto';

@Injectable()
export class GastoFijoMapper {
  constructor(
    private usuarioMapper: UsuarioMapper,
    private categoriaMapper: CategoriaMapper,
  ) {}

  async entity2DTO(gastoFijo: GastoFijo): Promise<GastoFijoDTO> {
    const dto = plainToInstance(GastoFijoDTO, gastoFijo, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    dto.montoEstimado = Number(gastoFijo.montoEstimado ?? 0);
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
      page.data.map((gastoFijo) => this.entity2DTO(gastoFijo)),
    );
    const pageDto = new PageDto<GastoFijoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async page2MisGastosFijosDto(
    request: SearchGastoFijoRequestDto,
    page: PageDto<GastoFijo>,
  ): Promise<PageDto<GastoFijoDTO>> {
    const dtos = await Promise.all(
      page.data.map((gastoFijo) => this.entity2DTO(gastoFijo)),
    );
    const pageDto = new PageDto<GastoFijoDTO>(dtos, page.metadata.count);
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
    const gastosFijos: GastoFijoDTO[] = await Promise.all(
      page.data.map((gastoFijo) => this.entity2DTO(gastoFijo)),
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

  createDTO2Entity(request: CreateGastoFijoRequestDto): Promise<GastoFijo> {
    const newGastoFijo = new GastoFijo();
    newGastoFijo.nombre = request.nombre;
    newGastoFijo.tipo = request.tipo;
    newGastoFijo.montoEstimado = request.montoEstimado ?? 0;
    newGastoFijo.diaVencimiento = request.diaVencimiento ? new Date(request.diaVencimiento) : new Date();
    newGastoFijo.activo = true;
    newGastoFijo.categoria = Categoria.fromId(request.categoriaId);
    newGastoFijo.esDebitoAutomatico = request.esDebitoAutomatico;
    return Promise.resolve(newGastoFijo);
  }

  async updateDTO2Entity(gastoFijo: GastoFijo, request: UpdateGastoFijoRequestDto): Promise<GastoFijo> {
    if (request.nombre !== undefined) {
      gastoFijo.nombre = request.nombre;
    }
    if (request.tipo !== undefined) {
      gastoFijo.tipo = request.tipo;
    }
    if (request.montoEstimado !== undefined) {
      gastoFijo.montoEstimado = request.montoEstimado;
    }
    if (request.diaVencimiento !== undefined) {
      gastoFijo.diaVencimiento = new Date(request.diaVencimiento);
    }
    if (request.activo !== undefined) {
      gastoFijo.activo = request.activo;
    }
    if (request.esDebitoAutomatico !== undefined) {
      gastoFijo.esDebitoAutomatico = request.esDebitoAutomatico;
    }
    if (request.categoriaId !== undefined) {
      gastoFijo.categoria = Categoria.fromId(request.categoriaId);
    }
    return gastoFijo;
  }
}

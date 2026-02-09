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
import { MedioPagoMapper } from 'src/schematics/medio-pago/mappers/medio-pago.mapper';
import { MedioPago } from 'src/schematics/medio-pago/entities/medio-pago.entity';

@Injectable()
export class GastoFijoMapper {
  constructor(
    private usuarioMapper: UsuarioMapper,
    private categoriaMapper: CategoriaMapper,
    private medioPagoMapper: MedioPagoMapper,
  ) {}

  async entity2DTO(gastoFijo: GastoFijo): Promise<GastoFijoDTO> {
    const dto = plainToInstance(GastoFijoDTO, gastoFijo, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    dto.montoFijo = Number(gastoFijo.montoFijo ?? 0);
    if (gastoFijo.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(gastoFijo.categoria);
    }
    if (gastoFijo.medioPago) {
      dto.medioPago = await this.medioPagoMapper.entity2DTO(gastoFijo.medioPago);
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

  /**
   * Construye la respuesta de mis-gastos-fijos: solo usuario (cabecera), gastosFijos (GastoFijoDTO sin usuario ni pagos) y metadata.
   */
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

  createDTO2Entity(
    request: CreateGastoFijoRequestDto,
  ): GastoFijo {
    const newGastoFijo: GastoFijo = new GastoFijo();
    newGastoFijo.nombre = request.nombre;
    newGastoFijo.montoFijo = request.montoFijo != null ? request.montoFijo : null;
    newGastoFijo.activo = true; // por defecto activo al crear
    newGastoFijo.categoria = Categoria.fromId(request.categoriaId);
    newGastoFijo.esDebitoAutomatico = request.esDebitoAutomatico;
    newGastoFijo.medioPago = request.medioPagoId ? MedioPago.fromId(request.medioPagoId) : null;
    return newGastoFijo;
  }

  updateDTO2Entity(
    gastoFijo: GastoFijo,
    request: UpdateGastoFijoRequestDto,
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
    if (request.esDebitoAutomatico !== undefined) {
      gastoFijo.esDebitoAutomatico = request.esDebitoAutomatico;
    }
    if (request.categoriaId !== undefined) {
      gastoFijo.categoria = Categoria.fromId(request.categoriaId);
    }
    if (request.medioPagoId !== undefined) {
      gastoFijo.medioPago = request.medioPagoId ? MedioPago.fromId(request.medioPagoId) : null;
    }
    return gastoFijo;
  }
}

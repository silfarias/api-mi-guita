import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Movimiento } from '../entities/movimiento.entity';
import { MovimientoDTO, MovimientoAgrupadoDTO, MovimientoSimpleDTO, MovimientoItemAgrupadoDTO } from '../dto/movimiento.dto';
import { CreateMovimientoRequestDto } from '../dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from '../dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from '../dto/search-movimiento-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { Cuenta } from 'src/schematics/cuenta/entities/cuenta.entity';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { CategoriaMapper } from 'src/schematics/categoria/mappers/categoria.mapper';
import { CuentaMapper } from 'src/schematics/cuenta/mappers/cuenta.mapper';

@Injectable()
export class MovimientoMapper {
  constructor(
    private categoriaMapper: CategoriaMapper,
    private cuentaMapper: CuentaMapper,
  ) {}

  async entity2DTO(movimiento: Movimiento): Promise<MovimientoDTO> {
    const dto = plainToInstance(MovimientoDTO, movimiento, {
      excludeExtraneousValues: true,
    });
    if (movimiento.cuenta) {
      dto.cuenta = await this.cuentaMapper.entity2DTO(movimiento.cuenta);
    }
    if (movimiento.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(movimiento.categoria);
    }
    return dto;
  }

  async entity2SimpleDTO(movimiento: Movimiento): Promise<MovimientoSimpleDTO> {
    const dto = plainToInstance(MovimientoSimpleDTO, movimiento, {
      excludeExtraneousValues: true,
    });
    if (movimiento.cuenta) {
      dto.cuenta = await this.cuentaMapper.entity2DTO(movimiento.cuenta);
    }
    if (movimiento.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(movimiento.categoria);
    }
    return dto;
  }

  /** Para listado agrupado por cuenta: mismo contenido que Simple pero sin cuenta (evita redundancia). */
  async entity2ItemAgrupadoDTO(movimiento: Movimiento): Promise<MovimientoItemAgrupadoDTO> {
    const dto = plainToInstance(MovimientoItemAgrupadoDTO, movimiento, {
      excludeExtraneousValues: true,
    });
    if (movimiento.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(movimiento.categoria);
    }
    dto.monto = Number(movimiento.monto ?? 0);
    return dto;
  }

  async page2Dto(
    request: SearchMovimientoRequestDto,
    page: PageDto<Movimiento>,
  ): Promise<PageDto<MovimientoDTO>> {
    const dtos = await Promise.all(
      page.data.map((movimiento) => this.entity2DTO(movimiento)),
    );
    const pageDto = new PageDto<MovimientoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async page2AgrupadoDto(
    request: SearchMovimientoRequestDto,
    page: PageDto<Movimiento>,
  ): Promise<PageDto<MovimientoAgrupadoDTO>> {
    const agrupados = new Map<number, Movimiento[]>();
    page.data.forEach((movimiento) => {
      if (movimiento.cuenta?.id) {
        const cuentaId = movimiento.cuenta.id;
        if (!agrupados.has(cuentaId)) {
          agrupados.set(cuentaId, []);
        }
        agrupados.get(cuentaId)!.push(movimiento);
      }
    });

    const dtosAgrupados = await Promise.all(
      Array.from(agrupados.entries()).map(async ([cuentaId, movimientos]) => {
        const cuenta = movimientos[0].cuenta;
        const movimientosDTOs = await Promise.all(
          movimientos.map((m) => this.entity2ItemAgrupadoDTO(m)),
        );
        const agrupado = plainToInstance(MovimientoAgrupadoDTO, {}, {
          excludeExtraneousValues: true,
        });
        agrupado.cuenta = await this.cuentaMapper.entity2DTO(cuenta!);
        agrupado.movimientos = movimientosDTOs;
        return agrupado;
      }),
    );

    const pageDto = new PageDto<MovimientoAgrupadoDTO>(dtosAgrupados, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(
    request: CreateMovimientoRequestDto,
    cuenta: Cuenta,
    categoria: Categoria | null,
    usuarioId: number,
  ): Promise<Movimiento> {
    const newMovimiento = new Movimiento();
    newMovimiento.fecha = request.fecha ? new Date(request.fecha) : new Date();
    newMovimiento.tipoMovimiento = request.tipoMovimiento;
    newMovimiento.descripcion = request.descripcion;
    newMovimiento.monto = request.monto;
    newMovimiento.cuenta = cuenta;
    newMovimiento.categoria = categoria;
    newMovimiento.usuario = { id: usuarioId } as any;
    return newMovimiento;
  }

  async updateDTO2Entity(
    movimiento: Movimiento,
    request: UpdateMovimientoRequestDto,
  ): Promise<Movimiento> {
    if (request.fecha !== undefined) {
      movimiento.fecha = request.fecha ? new Date(request.fecha) : new Date();
    }
    if (request.tipoMovimiento !== undefined) {
      movimiento.tipoMovimiento = request.tipoMovimiento;
    }
    if (request.descripcion !== undefined) {
      movimiento.descripcion = request.descripcion;
    }
    if (request.monto !== undefined) {
      movimiento.monto = request.monto;
    }
    if (request.categoriaId !== undefined) {
      movimiento.categoria = request.categoriaId ? Categoria.fromId(request.categoriaId) : null;
    }
    if (request.cuentaId !== undefined) {
      movimiento.cuenta = request.cuentaId ? Cuenta.fromId(request.cuentaId) : movimiento.cuenta;
    }
    return movimiento;
  }
}

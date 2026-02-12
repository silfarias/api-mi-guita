import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Movimiento } from '../entities/movimiento.entity';
import { MovimientoDTO, MovimientoAgrupadoDTO, MovimientoSimpleDTO } from '../dto/movimiento.dto';
import { CreateMovimientoRequestDto } from '../dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from '../dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from '../dto/search-movimiento-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { InfoInicialMapper } from 'src/schematics/info-inicial/mappers/info-inicial.mapper';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { MedioPago } from 'src/schematics/medio-pago/entities/medio-pago.entity';
import { CategoriaMapper } from 'src/schematics/categoria/mappers/categoria.mapper';
import { MedioPagoMapper } from 'src/schematics/medio-pago/mappers/medio-pago.mapper';

@Injectable()
export class MovimientoMapper {
  constructor(
    private infoInicialMapper: InfoInicialMapper,
    private categoriaMapper: CategoriaMapper,
    private medioPagoMapper: MedioPagoMapper,
  ) {}

  async entity2DTO(movimiento: Movimiento): Promise<MovimientoDTO> {
    const dto = plainToInstance(MovimientoDTO, movimiento, {
      excludeExtraneousValues: true,
    });
    
    if (movimiento.infoInicial) {
      dto.infoInicial = await this.infoInicialMapper.entity2DTO(movimiento.infoInicial);
    }
    
    if (movimiento.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(movimiento.categoria);
    }
    
    if (movimiento.medioPago) {
      dto.medioPago = await this.medioPagoMapper.entity2DTO(movimiento.medioPago);
    }
    
    return dto;
  }

  async entity2SimpleDTO(movimiento: Movimiento): Promise<MovimientoSimpleDTO> {
    const dto = plainToInstance(MovimientoSimpleDTO, movimiento, {
      excludeExtraneousValues: true,
    });
    
    if (movimiento.categoria) {
      dto.categoria = await this.categoriaMapper.entity2DTO(movimiento.categoria);
    }
    
    if (movimiento.medioPago) {
      dto.medioPago = await this.medioPagoMapper.entity2DTO(movimiento.medioPago);
    }
    
    return dto;
  }

  async page2Dto(
    request: SearchMovimientoRequestDto,
    page: PageDto<Movimiento>,
  ): Promise<PageDto<MovimientoDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (movimiento) => {
        return this.entity2DTO(movimiento);
      }),
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
    // Agrupar movimientos por infoInicial
    const movimientosAgrupados = new Map<number, Movimiento[]>();
    
    page.data.forEach((movimiento) => {
      // Solo agrupar si tiene infoInicial
      if (movimiento.infoInicial && movimiento.infoInicial.id) {
        const infoInicialId = movimiento.infoInicial.id;
        if (!movimientosAgrupados.has(infoInicialId)) {
          movimientosAgrupados.set(infoInicialId, []);
        }
        movimientosAgrupados.get(infoInicialId)!.push(movimiento);
      }
    });

    // Convertir a DTOs agrupados
    const dtosAgrupados = await Promise.all(
      Array.from(movimientosAgrupados.entries()).map(async ([infoInicialId, movimientos]) => {
        const infoInicial = movimientos[0].infoInicial;
        const movimientosDTOs = await Promise.all(
          movimientos.map(async (movimiento) => {
            return this.entity2SimpleDTO(movimiento);
          })
        );

        const agrupado: MovimientoAgrupadoDTO = plainToInstance(MovimientoAgrupadoDTO, {}, {
          excludeExtraneousValues: true,
        });
        agrupado.infoInicial = await this.infoInicialMapper.entity2DTO(infoInicial);
        agrupado.movimientos = movimientosDTOs;
        
        return agrupado;
      })
    );

    const pageDto = new PageDto<MovimientoAgrupadoDTO>(dtosAgrupados, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(
    request: CreateMovimientoRequestDto, 
    infoInicial: InfoInicial,
    categoria: Categoria,
    medioPago: MedioPago,
  ): Movimiento {
    const newMovimiento: Movimiento = new Movimiento();
    newMovimiento.fecha = request.fecha ? request.fecha : new Date();
    newMovimiento.tipoMovimiento = request.tipoMovimiento;
    newMovimiento.descripcion = request.descripcion;
    newMovimiento.monto = request.monto;
    newMovimiento.infoInicial = infoInicial;
    newMovimiento.categoria = categoria;
    newMovimiento.medioPago = medioPago;
    return newMovimiento;
  }

  updateDTO2Entity(
    movimiento: Movimiento,
    request: UpdateMovimientoRequestDto,
    categoria?: Categoria,
    medioPago?: MedioPago,
  ): Movimiento {
    if (request.fecha !== undefined) {
      movimiento.fecha = request.fecha ? request.fecha : new Date();
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
    if (categoria !== undefined) {
      movimiento.categoria = categoria;
    }
    if (medioPago !== undefined) {
      movimiento.medioPago = medioPago;
    }
    return movimiento;
  }
}

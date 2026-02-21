import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateMovimientoRequestDto } from './dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from './dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from './dto/search-movimiento-request.dto';
import { MovimientoDTO, MovimientoAgrupadoDTO, MovimientoSimpleDTO } from './dto/movimiento.dto';
import { MovimientoMapper } from './mappers/movimiento.mapper';
import { MovimientoRepository } from './repository/movimiento.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';
import { ReportesService } from '../reportes/reportes.service';

@Injectable()
export class MovimientoService {
  constructor(
    private movimientoMapper: MovimientoMapper,
    private movimientoRepository: MovimientoRepository,
    private infoInicialRepository: InfoInicialRepository,
    private categoriaRepository: CategoriaRepository,
    private medioPagoRepository: MedioPagoRepository,
    @Inject(forwardRef(() => ReportesService))
    private reportesService: ReportesService,
  ) {}

  async findOne(id: number): Promise<MovimientoDTO> {
    const movimiento = await this.movimientoRepository.findOneById(id);
    return await this.movimientoMapper.entity2DTO(movimiento);
  }

  async search(request: SearchMovimientoRequestDto): Promise<PageDto<MovimientoDTO>> {
    const movimientoPage = await this.movimientoRepository.search(request);
    return this.movimientoMapper.page2Dto(request, movimientoPage);
  }

  async searchAgrupado(request: SearchMovimientoRequestDto, usuarioId: number): Promise<PageDto<MovimientoAgrupadoDTO>> {
    // Buscar movimientos del usuario autenticado (filtrado directo en la consulta)
    const movimientoPage = await this.movimientoRepository.search(request, usuarioId);
    return this.movimientoMapper.page2AgrupadoDto(request, movimientoPage);
  }

  async create(request: CreateMovimientoRequestDto, usuarioId: number): Promise<MovimientoSimpleDTO> {
    try {
      // Validar que la información inicial existe y pertenece al usuario
      const infoInicial = await this.infoInicialRepository.findOne({
        where: { id: request.infoInicialId },
        relations: ['usuario'],
      });

      if (!infoInicial) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Información inicial no encontrada',
          details: JSON.stringify({ infoInicialId: request.infoInicialId }),
        });
      }

      // Validar que la información inicial pertenece al usuario autenticado
      if (infoInicial.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para crear movimientos en esta información inicial',
          details: JSON.stringify({ infoInicialId: request.infoInicialId }),
        });
      }

      // Validar que la categoría existe
      const categoria = await this.categoriaRepository.findOne({
        where: { id: request.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Categoría no encontrada',
          details: JSON.stringify({ categoriaId: request.categoriaId }),
        });
      }

      // Validar que el medio de pago existe
      const medioPago = await this.medioPagoRepository.findOne({
        where: { id: request.medioPagoId },
      });

      if (!medioPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Medio de pago no encontrado',
          details: JSON.stringify({ medioPagoId: request.medioPagoId }),
        });
      }

      // Crear el movimiento
      const newMovimiento = this.movimientoMapper.createDTO2Entity(request, infoInicial, categoria, medioPago);
      const movimientoSaved = await this.movimientoRepository.save(newMovimiento);
      await this.reportesService.recalcularResumenMensual(infoInicial.id);
      return await this.movimientoMapper.entity2SimpleDTO(movimientoSaved);

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
    request: UpdateMovimientoRequestDto,
    usuarioId: number,
  ): Promise<MovimientoSimpleDTO> {
    try {
      // Verificar que el movimiento existe y pertenece al usuario
      const movimiento = await this.movimientoRepository.findOne({
        where: { id: id },
        relations: ['infoInicial', 'infoInicial.usuario', 'categoria', 'medioPago'],
      });

      if (!movimiento) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      if (movimiento.infoInicial.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
          details: 'No tienes permiso para modificar este movimiento',
        });
      }

      // Validar y cargar categoría si se está actualizando
      let categoria = movimiento.categoria;
      if (request.categoriaId !== undefined && request.categoriaId !== movimiento.categoria?.id) {
        const nuevaCategoria = await this.categoriaRepository.findOne({
          where: { id: request.categoriaId },
        });

        if (!nuevaCategoria) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Categoría no encontrada',
            details: JSON.stringify({ categoriaId: request.categoriaId }),
          });
        }
        categoria = nuevaCategoria;
      }

      // Validar y cargar medio de pago si se está actualizando
      let medioPago = movimiento.medioPago;
      if (request.medioPagoId !== undefined && request.medioPagoId !== movimiento.medioPago?.id) {
        const nuevoMedioPago = await this.medioPagoRepository.findOne({
          where: { id: request.medioPagoId },
        });

        if (!nuevoMedioPago) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Medio de pago no encontrado',
            details: JSON.stringify({ medioPagoId: request.medioPagoId }),
          });
        }
        medioPago = nuevoMedioPago;
      }

      const updateMovimiento = this.movimientoMapper.updateDTO2Entity(movimiento, request, categoria, medioPago);
      await this.movimientoRepository.save(updateMovimiento);
      await this.reportesService.recalcularResumenMensual(movimiento.infoInicial.id);
      return this.movimientoMapper.entity2SimpleDTO(movimiento);
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

  async remove(id: number, usuarioId: number): Promise<string> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id: id },
      relations: ['infoInicial', 'infoInicial.usuario'],
    });

    if (!movimiento) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (movimiento.infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar este movimiento',
        details: JSON.stringify({ id }),
      });
    }

    await this.movimientoRepository.softRemove(movimiento);
    await this.reportesService.recalcularResumenMensual(movimiento.infoInicial.id);
    return 'Movimiento eliminado correctamente';
  }
}

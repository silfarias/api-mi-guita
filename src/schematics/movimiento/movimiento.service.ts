import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMovimientoRequestDto } from './dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from './dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from './dto/search-movimiento-request.dto';
import { MovimientoDTO, MovimientoAgrupadoDTO, MovimientoSimpleDTO } from './dto/movimiento.dto';
import { MovimientoMapper } from './mappers/movimiento.mapper';
import { MovimientoRepository } from './repository/movimiento.repository';
import { CuentaRepository } from '../cuenta/repository/cuenta.repository';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { Categoria } from '../categoria/entities/categoria.entity';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

@Injectable()
export class MovimientoService {
  constructor(
    private movimientoMapper: MovimientoMapper,
    private movimientoRepository: MovimientoRepository,
    private cuentaRepository: CuentaRepository,
    private categoriaRepository: CategoriaRepository,
    private errorHandler: ErrorHandlerService,
  ) {}

  async findOne(id: number): Promise<MovimientoDTO> {
    const movimiento = await this.movimientoRepository.findOneById(id);
    return this.movimientoMapper.entity2DTO(movimiento);
  }

  async search(request: SearchMovimientoRequestDto, usuarioId: number): Promise<PageDto<MovimientoDTO>> {
    const movimientoPage = await this.movimientoRepository.search(request, usuarioId);
    return this.movimientoMapper.page2Dto(request, movimientoPage);
  }

  async searchAgrupado(request: SearchMovimientoRequestDto, usuarioId: number): Promise<PageDto<MovimientoAgrupadoDTO>> {
    const movimientoPage = await this.movimientoRepository.search(request, usuarioId);
    return this.movimientoMapper.page2AgrupadoDto(request, movimientoPage);
  }

  private async aplicarSaldo(
    cuentaId: number,
    monto: number,
    tipo: TipoMovimientoEnum,
    sumar: boolean,
  ): Promise<void> {
    const cuenta = await this.cuentaRepository.findOne({ where: { id: cuentaId } });
    if (!cuenta) return;
    const delta =
      tipo === TipoMovimientoEnum.INGRESO || tipo === TipoMovimientoEnum.SALDO_INICIAL
        ? (sumar ? monto : -monto)
        : tipo === TipoMovimientoEnum.EGRESO
          ? (sumar ? -monto : monto)
          : 0;
    if (delta === 0) return;
    cuenta.saldoActual = Number(cuenta.saldoActual ?? 0) + delta;
    await this.cuentaRepository.save(cuenta);
  }

  /**
   * Crea un movimiento de tipo SALDO_INICIAL y actualiza el saldo de la cuenta.
   * Usado al crear una cuenta con saldo inicial (onboarding).
   */
  async createSaldoInicial(cuentaId: number, monto: number, usuarioId: number): Promise<void> {
    if (monto <= 0) return;
    const cuenta = await this.cuentaRepository.findOne({
      where: { id: cuentaId, usuario: { id: usuarioId } },
      relations: ['usuario'],
    });
    if (!cuenta) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Cuenta no encontrada',
        details: JSON.stringify({ cuentaId }),
      });
    }
    const saldoInicialRequest: CreateMovimientoRequestDto = {
      cuentaId,
      tipoMovimiento: TipoMovimientoEnum.SALDO_INICIAL,
      descripcion: 'Saldo inicial',
      monto,
      fecha: new Date()
    };
    const newMovimiento = await this.movimientoMapper.createDTO2Entity(
      saldoInicialRequest,
      cuenta,
      null,
      usuarioId,
    );
    await this.movimientoRepository.save(newMovimiento);
    await this.aplicarSaldo(cuentaId, monto, TipoMovimientoEnum.SALDO_INICIAL, true);
  }

  async create(request: CreateMovimientoRequestDto, usuarioId: number): Promise<MovimientoSimpleDTO> {
    const cuenta = await this.cuentaRepository.findOne({
      where: { id: request.cuentaId, usuario: { id: usuarioId } },
      relations: ['usuario'],
    });
    if (!cuenta) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Cuenta no encontrada',
        details: JSON.stringify({ cuentaId: request.cuentaId }),
      });
    }

    let categoria: Categoria | null = null;
    if (request.tipoMovimiento !== TipoMovimientoEnum.SALDO_INICIAL && request.categoriaId != null) {
      categoria = await this.categoriaRepository.findOne({ where: { id: request.categoriaId } });
      if (!categoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Categoría no encontrada',
          details: JSON.stringify({ categoriaId: request.categoriaId }),
        });
      }
    }

    const newMovimiento = await this.movimientoMapper.createDTO2Entity(
      request,
      cuenta,
      categoria,
      usuarioId,
    );
    const movimientoSaved = await this.movimientoRepository.save(newMovimiento);
    await this.aplicarSaldo(request.cuentaId, request.monto, request.tipoMovimiento, true);
    return this.movimientoMapper.entity2SimpleDTO(movimientoSaved);
  }

  async update(
    id: number,
    request: UpdateMovimientoRequestDto,
    usuarioId: number,
  ): Promise<MovimientoSimpleDTO> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id },
      relations: ['cuenta', 'cuenta.usuario', 'categoria', 'usuario'],
    });
    if (!movimiento) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    if (movimiento.usuario?.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: 'No tienes permiso para modificar este movimiento',
      });
    }

    let categoria = movimiento.categoria ?? undefined;
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

    let cuenta = movimiento.cuenta;
    if (request.cuentaId !== undefined && request.cuentaId !== movimiento.cuenta?.id) {
      const nuevaCuenta = await this.cuentaRepository.findOne({
        where: { id: request.cuentaId, usuario: { id: usuarioId } },
      });
      if (!nuevaCuenta) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Cuenta no encontrada',
          details: JSON.stringify({ cuentaId: request.cuentaId }),
        });
      }
      cuenta = nuevaCuenta;
    }

    const montoAnterior = Number(movimiento.monto);
    const tipoAnterior = movimiento.tipoMovimiento;
    const cuentaIdAnterior = movimiento.cuenta?.id;

    const montoNuevo = request.monto !== undefined ? request.monto : montoAnterior;
    const tipoNuevo = request.tipoMovimiento !== undefined ? request.tipoMovimiento : tipoAnterior;
    const cuentaIdNuevo = cuenta?.id ?? cuentaIdAnterior;

    const updateMovimiento = await this.movimientoMapper.updateDTO2Entity(
      movimiento,
      request,
      categoria,
      cuenta,
    );
    await this.movimientoRepository.save(updateMovimiento);

    if (cuentaIdAnterior != null) {
      await this.aplicarSaldo(cuentaIdAnterior, montoAnterior, tipoAnterior, false);
    }
    if (cuentaIdNuevo != null) {
      await this.aplicarSaldo(cuentaIdNuevo, montoNuevo, tipoNuevo, true);
    }

    const updated = await this.movimientoRepository.findOneById(id);
    return this.movimientoMapper.entity2SimpleDTO(updated);
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id },
      relations: ['cuenta', 'usuario'],
    });
    if (!movimiento) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    if (movimiento.usuario?.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar este movimiento',
        details: JSON.stringify({ id }),
      });
    }
    await this.movimientoRepository.softRemove(movimiento);
    if (movimiento.cuenta?.id != null) {
      await this.aplicarSaldo(
        movimiento.cuenta.id,
        Number(movimiento.monto),
        movimiento.tipoMovimiento,
        false,
      );
    }
    return 'Movimiento eliminado correctamente';
  }
}

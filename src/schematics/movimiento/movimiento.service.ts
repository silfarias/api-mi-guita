import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMovimientoRequestDto } from './dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from './dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from './dto/search-movimiento-request.dto';
import { MovimientoDTO, MovimientoAgrupadoDTO, MovimientoSimpleDTO } from './dto/movimiento.dto';
import { MovimientoMapper } from './mappers/movimiento.mapper';
import { MovimientoRepository } from './repository/movimiento.repository';
import { CuentaRepository } from '../cuenta/repository/cuenta.repository';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { SaldoService } from '../cuenta/saldo.service';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Movimiento } from './entities/movimiento.entity';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

@Injectable()
export class MovimientoService {
  constructor(
    private movimientoMapper: MovimientoMapper,
    private movimientoRepository: MovimientoRepository,
    private cuentaRepository: CuentaRepository,
    private categoriaRepository: CategoriaRepository,
    private saldoService: SaldoService,
    private dataSource: DataSource,
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

  /**
   * Valida que para INGRESO/EGRESO la categoría sea obligatoria y que su tipo coincida.
   */
  private validarCategoriaParaTipo(
    tipoMovimiento: TipoMovimientoEnum,
    categoria: Categoria | null,
    categoriaId?: number,
  ): void {
    if (tipoMovimiento === TipoMovimientoEnum.SALDO_INICIAL || tipoMovimiento === TipoMovimientoEnum.TRANSFERENCIA) {
      return;
    }
    if (tipoMovimiento === TipoMovimientoEnum.INGRESO || tipoMovimiento === TipoMovimientoEnum.EGRESO) {
      if (!categoriaId && !categoria) {
        this.errorHandler.throwBadRequest(
          {
            CODE: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            MESSAGE: 'La categoría es obligatoria para movimientos de tipo INGRESO y EGRESO',
          },
        );
      }
      if (categoria && tipoMovimiento === TipoMovimientoEnum.INGRESO && categoria.tipo !== TipoCategoriaEnum.INGRESO) {
        this.errorHandler.throwBadRequest(
          {
            CODE: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            MESSAGE: 'La categoría debe ser de tipo INGRESO para este movimiento',
          },
        );
      }
      if (categoria && tipoMovimiento === TipoMovimientoEnum.EGRESO && categoria.tipo !== TipoCategoriaEnum.EGRESO) {
        this.errorHandler.throwBadRequest(
          {
            CODE: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            MESSAGE: 'La categoría debe ser de tipo EGRESO para este movimiento',
          },
        );
      }
    }
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
      this.errorHandler.throwNotFound(
        {
          CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          MESSAGE: 'Cuenta no encontrada',
        },
        { cuentaId },
      );
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const saldoInicialRequest: CreateMovimientoRequestDto = {
        cuentaId,
        tipoMovimiento: TipoMovimientoEnum.SALDO_INICIAL,
        descripcion: 'Saldo inicial',
        monto,
        fecha: new Date(),
      };
      const newMovimiento = await this.movimientoMapper.createDTO2Entity(
        saldoInicialRequest,
        cuenta,
        null,
        usuarioId,
      );
      await queryRunner.manager.getRepository(Movimiento).save(newMovimiento);
      await this.saldoService.aplicarMovimiento(
        cuentaId,
        TipoMovimientoEnum.SALDO_INICIAL,
        monto,
        true,
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async create(request: CreateMovimientoRequestDto, usuarioId: number): Promise<MovimientoSimpleDTO> {
    const cuenta = await this.cuentaRepository.findOne({
      where: { id: request.cuentaId, usuario: { id: usuarioId } },
      relations: ['usuario'],
    });
    if (!cuenta) {
      this.errorHandler.throwNotFound(
        {
          CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          MESSAGE: 'Cuenta no encontrada',
        },
        { cuentaId: request.cuentaId },
      );
    }

    let categoria: Categoria | null = null;
    if (request.tipoMovimiento !== TipoMovimientoEnum.SALDO_INICIAL && request.categoriaId != null) {
      categoria = await this.categoriaRepository.findOne({ where: { id: request.categoriaId } });
      if (!categoria) {
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Categoría no encontrada',
          },
          { categoriaId: request.categoriaId },
        );
      }
    }
    this.validarCategoriaParaTipo(request.tipoMovimiento, categoria, request.categoriaId);

    const newMovimiento = await this.movimientoMapper.createDTO2Entity(
      request,
      cuenta,
      categoria,
      usuarioId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const movimientoSaved = await queryRunner.manager.getRepository(Movimiento).save(newMovimiento);
      if (request.tipoMovimiento !== TipoMovimientoEnum.TRANSFERENCIA) {
        await this.saldoService.aplicarMovimiento(
          request.cuentaId,
          request.tipoMovimiento,
          request.monto,
          true,
          queryRunner.manager,
        );
      }
      await queryRunner.commitTransaction();
      const withRelations = await this.movimientoRepository.findOne({
        where: { id: movimientoSaved.id },
        relations: ['cuenta', 'categoria', 'usuario'],
      });
      return this.movimientoMapper.entity2SimpleDTO(withRelations ?? movimientoSaved);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
      this.errorHandler.throwNotFound(
        ERRORS.DATABASE.RECORD_NOT_FOUND,
        { id },
      );
    }
    if (movimiento.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        'No tienes permiso para modificar este movimiento',
      );
    }

    let categoria = movimiento.categoria ?? undefined;
    if (request.categoriaId !== undefined && request.categoriaId !== movimiento.categoria?.id) {
      const nuevaCategoria = await this.categoriaRepository.findOne({
        where: { id: request.categoriaId },
      });
      if (!nuevaCategoria) {
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Categoría no encontrada',
          },
          { categoriaId: request.categoriaId },
        );
      }
      categoria = nuevaCategoria;
    }
    const tipoNuevo = request.tipoMovimiento !== undefined ? request.tipoMovimiento : movimiento.tipoMovimiento;
    this.validarCategoriaParaTipo(
      tipoNuevo,
      categoria ?? movimiento.categoria ?? null,
      request.categoriaId ?? movimiento.categoria?.id,
    );

    let cuenta = movimiento.cuenta;
    if (request.cuentaId !== undefined && request.cuentaId !== movimiento.cuenta?.id) {
      const nuevaCuenta = await this.cuentaRepository.findOne({
        where: { id: request.cuentaId, usuario: { id: usuarioId } },
      });
      if (!nuevaCuenta) {
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Cuenta no encontrada',
          },
          { cuentaId: request.cuentaId },
        );
      }
      cuenta = nuevaCuenta;
    }

    const montoAnterior = Number(movimiento.monto);
    const tipoAnterior = movimiento.tipoMovimiento;
    const cuentaIdAnterior = movimiento.cuenta?.id;

    const montoNuevo = request.monto !== undefined ? request.monto : montoAnterior;
    const cuentaIdNuevo = cuenta?.id ?? cuentaIdAnterior;

    const updateMovimiento = await this.movimientoMapper.updateDTO2Entity(
      movimiento,
      request,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.getRepository(Movimiento).save(updateMovimiento);
      if (cuentaIdAnterior != null) {
        await this.saldoService.aplicarMovimiento(
          cuentaIdAnterior,
          tipoAnterior,
          montoAnterior,
          false,
          queryRunner.manager,
        );
      }
      if (cuentaIdNuevo != null) {
        await this.saldoService.aplicarMovimiento(
          cuentaIdNuevo,
          tipoNuevo,
          montoNuevo,
          true,
          queryRunner.manager,
        );
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
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
      this.errorHandler.throwNotFound(
        ERRORS.DATABASE.RECORD_NOT_FOUND,
        { id },
      );
    }
    if (movimiento.usuario?.id !== usuarioId) {
      this.errorHandler.throwBadRequest(
        ERRORS.VALIDATION.INVALID_INPUT,
        { id, message: 'No tienes permiso para eliminar este movimiento' },
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.getRepository(Movimiento).softRemove(movimiento);
      if (movimiento.cuenta?.id != null && movimiento.tipoMovimiento !== TipoMovimientoEnum.TRANSFERENCIA) {
        await this.saldoService.aplicarMovimiento(
          movimiento.cuenta.id,
          movimiento.tipoMovimiento,
          Number(movimiento.monto),
          false,
          queryRunner.manager,
        );
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return 'Movimiento eliminado correctamente';
  }
}

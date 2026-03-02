import { Injectable, HttpException, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Cuenta } from './entities/cuenta.entity';
import { CuentaMapper } from './mappers/cuenta.mapper';
import { CuentaRepository } from './repository/cuenta.repository';
import { CuentaDTO } from './dto/cuenta.dto';
import { CreateCuentaRequestDto } from './dto/create-cuenta-request.dto';
import { CreateCuentaBulkRequestDto } from './dto/create-cuenta-bulk-request.dto';
import { UpdateCuentaRequestDto } from './dto/update-cuenta-request.dto';
import { SearchCuentaRequestDto } from './dto/search-cuenta-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { Usuario } from '../usuario/entities/usuario.entity';
import { MovimientoService } from '../movimiento/movimiento.service';

@Injectable()
export class CuentaService {
  constructor(
    private readonly cuentaMapper: CuentaMapper,
    private readonly cuentaRepository: CuentaRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => MovimientoService))
    private readonly movimientoService: MovimientoService,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<CuentaDTO> {
    try {
      const cuenta = await this.cuentaRepository.findOne({
        where: { id, usuario: { id: usuarioId } },
        relations: ['usuario'],
      });
      if (!cuenta) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Cuenta no encontrada',
          details: JSON.stringify({ id }),
        });
      }
      return await this.cuentaMapper.entity2DTO(cuenta);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchCuentaRequestDto, usuarioId: number): Promise<PageDto<CuentaDTO>> {
    try {
      const page = await this.cuentaRepository.search(request, usuarioId);
      return this.cuentaMapper.page2Dto(request, page);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async findAllByUsuario(usuarioId: number): Promise<CuentaDTO[]> {
    const cuentas = await this.cuentaRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario'],
      order: { nombre: 'ASC' },
    });
    return await Promise.all(cuentas.map((c) => this.cuentaMapper.entity2DTO(c)));
  }

  async create(request: CreateCuentaRequestDto, usuarioId: number): Promise<CuentaDTO> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);
      const newCuenta = (await this.cuentaMapper.createDTO2Entity(request)) as Cuenta;
      newCuenta.usuario = usuario;
      const saved = await this.cuentaRepository.save(newCuenta);
      const saldoInicial = request.saldoInicial ?? 0;
      if (saldoInicial > 0) {
        await this.movimientoService.createSaldoInicial(saved.id, saldoInicial, usuarioId);
      }
      const withRelations = await this.cuentaRepository.findOne({
        where: { id: saved.id },
        relations: ['usuario'],
      });
      return await this.cuentaMapper.entity2DTO(withRelations!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async createBulk(request: CreateCuentaBulkRequestDto, usuarioId: number): Promise<CuentaDTO[]> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);

      const nombresEnRequest = request.cuentas.map((c) => c.nombre.trim().toLowerCase());
      const nombresUnicos = new Set(nombresEnRequest);
      if (nombresEnRequest.length !== nombresUnicos.size) {
        const duplicados = nombresEnRequest.filter((n, i) => nombresEnRequest.indexOf(n) !== i);
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No se pueden crear cuentas con nombres duplicados en la misma solicitud',
          details: JSON.stringify({ nombresDuplicados: [...new Set(duplicados)] }),
        });
      }

      const cuentasExistentes = await this.cuentaRepository.find({
        where: { usuario: { id: usuarioId } },
      });
      const nombresExistentes = new Set(cuentasExistentes.map((c) => c.nombre.trim().toLowerCase()));
      const conflictos = request.cuentas.filter((c) =>
        nombresExistentes.has(c.nombre.trim().toLowerCase()),
      );
      if (conflictos.length > 0) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Ya existen cuentas con algunos de esos nombres para este usuario',
          details: JSON.stringify({ nombres: conflictos.map((c) => c.nombre) }),
        });
      }

      const nuevasCuentas = await Promise.all(
        request.cuentas.map(async (dto) => {
          const cuenta = (await this.cuentaMapper.createDTO2Entity(dto)) as Cuenta;
          cuenta.usuario = usuario;
          return cuenta;
        }),
      );

      const guardadas = await this.cuentaRepository.save(nuevasCuentas);
      for (let i = 0; i < guardadas.length; i++) {
        const saldoInicial = request.cuentas[i].saldoInicial ?? 0;
        if (saldoInicial > 0) {
          await this.movimientoService.createSaldoInicial(guardadas[i].id, saldoInicial, usuarioId);
        }
      }
      const ids = guardadas.map((c) => c.id);
      const conRelaciones = await this.cuentaRepository.find({
        where: ids.map((id) => ({ id })),
        relations: ['usuario'],
      });
      return await Promise.all(conRelaciones.map((c) => this.cuentaMapper.entity2DTO(c)));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdateCuentaRequestDto, usuarioId: number): Promise<CuentaDTO> {
    try {
      const cuenta = await this.cuentaRepository.findOne({
        where: { id, usuario: { id: usuarioId } },
        relations: ['usuario'],
      });
      if (!cuenta) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Cuenta no encontrada',
          details: JSON.stringify({ id }),
        });
      }
      const updated = await this.cuentaMapper.updateDTO2Entity(cuenta, request);
      await this.cuentaRepository.save(updated);
      const withRelations = await this.cuentaRepository.findOne({
        where: { id },
        relations: ['usuario'],
      });
      return await this.cuentaMapper.entity2DTO(withRelations!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const cuenta = await this.cuentaRepository.findOne({
        where: { id, usuario: { id: usuarioId } },
      });
      if (!cuenta) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Cuenta no encontrada',
          details: JSON.stringify({ id }),
        });
      }
      await this.cuentaRepository.softRemove(cuenta);
      return 'Cuenta eliminada correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }
}

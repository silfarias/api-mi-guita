import { Injectable, HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateTransferenciaRequestDto } from './dto/create-transferencia-request.dto';
import { TransferenciaDTO } from './dto/transferencia.dto';
import { TransferenciaMapper } from './mappers/transferencia.mapper';
import { TransferenciaRepository } from './repository/transferencia.repository';
import { CuentaRepository } from '../cuenta/repository/cuenta.repository';
import { SaldoService } from '../cuenta/saldo.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { Transferencia } from './entities/transferencia.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

@Injectable()
export class TransferenciaService {
  constructor(
    private transferenciaRepository: TransferenciaRepository,
    private cuentaRepository: CuentaRepository,
    private transferenciaMapper: TransferenciaMapper,
    private saldoService: SaldoService,
    private dataSource: DataSource,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async crearTransferencia(request: CreateTransferenciaRequestDto, usuarioId: number): Promise<TransferenciaDTO> {
    try {
      if (request.cuentaOrigenId === request.cuentaDestinoId) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          'La cuenta origen y destino no pueden ser la misma',
        );
      }

      const [cuentaOrigen, cuentaDestino] = await Promise.all([
        this.cuentaRepository.findOne({
          where: { id: request.cuentaOrigenId, usuario: { id: usuarioId } },
          relations: ['usuario'],
        }),
        this.cuentaRepository.findOne({
          where: { id: request.cuentaDestinoId, usuario: { id: usuarioId } },
          relations: ['usuario'],
        }),
      ]);

      if (!cuentaOrigen) {
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Cuenta origen no encontrada',
          },
          { cuentaOrigenId: request.cuentaOrigenId },
        );
      }
      if (!cuentaDestino) {
        this.errorHandler.throwNotFound(
          {
            CODE: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            MESSAGE: 'Cuenta destino no encontrada',
          },
          { cuentaDestinoId: request.cuentaDestinoId },
        );
      }

      const saldoOrigen = Number(cuentaOrigen.saldoActual ?? 0);
      if (saldoOrigen < request.monto) {
        this.errorHandler.throwBadRequest(
          ERRORS.VALIDATION.INVALID_INPUT,
          {
            message: 'Saldo insuficiente en la cuenta origen',
            cuenta: cuentaOrigen.nombre,
            saldoOrigen,
            monto: request.monto,
          },
        );
      }

      const fecha = request.fecha ? new Date(request.fecha) : new Date();
      const transferencia = new Transferencia();
      transferencia.cuentaOrigen = cuentaOrigen;
      transferencia.cuentaDestino = cuentaDestino;
      transferencia.monto = request.monto;
      transferencia.fecha = fecha;
      transferencia.usuario = { id: usuarioId } as Usuario;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const saved = await queryRunner.manager.getRepository(Transferencia).save(transferencia);
        await this.saldoService.aplicarTransferencia(
          request.cuentaOrigenId,
          request.cuentaDestinoId,
          request.monto,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();

        const withRelations = await this.transferenciaRepository.findOne({
          where: { id: saved.id },
          relations: ['cuentaOrigen', 'cuentaDestino'],
        });
        if (!withRelations) {
          this.errorHandler.throwNotFound(
            ERRORS.DATABASE.RECORD_NOT_FOUND,
            { id: saved.id, message: 'Error al recuperar la transferencia creada' },
          );
        }
        return await this.transferenciaMapper.entity2DTO(withRelations);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }
}

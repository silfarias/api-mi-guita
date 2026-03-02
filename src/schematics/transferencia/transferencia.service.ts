import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTransferenciaRequestDto } from './dto/create-transferencia-request.dto';
import { TransferenciaDTO } from './dto/transferencia.dto';
import { TransferenciaMapper } from './mappers/transferencia.mapper';
import { TransferenciaRepository } from './repository/transferencia.repository';
import { CuentaRepository } from '../cuenta/repository/cuenta.repository';
import { ERRORS } from 'src/common/errors/errors-codes';
import { Transferencia } from './entities/transferencia.entity';
import { Usuario } from '../usuario/entities/usuario.entity';

@Injectable()
export class TransferenciaService {
  constructor(
    private transferenciaRepository: TransferenciaRepository,
    private cuentaRepository: CuentaRepository,
    private transferenciaMapper: TransferenciaMapper,
  ) {}

  async crearTransferencia(request: CreateTransferenciaRequestDto, usuarioId: number): Promise<TransferenciaDTO> {
    if (request.cuentaOrigenId === request.cuentaDestinoId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'La cuenta origen y destino no pueden ser la misma',
        details: 'Debes seleccionar cuentas diferentes',
      });
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
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Cuenta origen no encontrada',
        details: JSON.stringify({ cuentaOrigenId: request.cuentaOrigenId }),
      });
    }
    if (!cuentaDestino) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Cuenta destino no encontrada',
        details: JSON.stringify({ cuentaDestinoId: request.cuentaDestinoId }),
      });
    }

    const fecha = request.fecha ? new Date(request.fecha) : new Date();
    const transferencia = new Transferencia();
    transferencia.cuentaOrigen = cuentaOrigen;
    transferencia.cuentaDestino = cuentaDestino;
    transferencia.monto = request.monto;
    transferencia.fecha = fecha;
    transferencia.usuario = { id: usuarioId } as Usuario;

    const saved = await this.transferenciaRepository.save(transferencia);

    cuentaOrigen.saldoActual = Number(cuentaOrigen.saldoActual ?? 0) - request.monto;
    cuentaDestino.saldoActual = Number(cuentaDestino.saldoActual ?? 0) + request.monto;
    await this.cuentaRepository.save([cuentaOrigen, cuentaDestino]);

    const withRelations = await this.transferenciaRepository.findOne({
      where: { id: saved.id },
      relations: ['cuentaOrigen', 'cuentaDestino'],
    });
    if (!withRelations) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Error al recuperar la transferencia creada',
      });
    }
    return await this.transferenciaMapper.entity2DTO(withRelations);
  }
}

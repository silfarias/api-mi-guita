import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Transferencia } from '../entities/transferencia.entity';
import { TransferenciaDTO } from '../dto/transferencia.dto';
import { CuentaMapper } from '../../cuenta/mappers/cuenta.mapper';

@Injectable()
export class TransferenciaMapper {
  constructor(private cuentaMapper: CuentaMapper) {}

  async entity2DTO(transferencia: Transferencia): Promise<TransferenciaDTO> {
    const dto = plainToInstance(TransferenciaDTO, transferencia, {
      excludeExtraneousValues: true,
    });
    if (transferencia.cuentaOrigen) {
      dto.cuentaOrigen = await this.cuentaMapper.entity2DTO(transferencia.cuentaOrigen);
    }
    if (transferencia.cuentaDestino) {
      dto.cuentaDestino = await this.cuentaMapper.entity2DTO(transferencia.cuentaDestino);
    }
    dto.monto = Number(transferencia.monto ?? 0);
    return dto;
  }
}

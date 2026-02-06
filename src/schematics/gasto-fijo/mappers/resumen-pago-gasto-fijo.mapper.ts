import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ResumenPagoGastoFijo } from '../entities/resumen-pago-gasto-fijo.entity';
import { ResumenPagoGastoFijoDTO } from '../dto/resumen-pago-gasto-fijo.dto';
import { InfoInicialMapper } from 'src/schematics/info-inicial/mappers/info-inicial.mapper';
import { UsuarioMapper } from 'src/schematics/usuario/mappers/usuario.mapper';

@Injectable()
export class ResumenPagoGastoFijoMapper {
  constructor(
    private infoInicialMapper: InfoInicialMapper,
    private usuarioMapper: UsuarioMapper,
  ) {}

  async entity2DTO(resumen: ResumenPagoGastoFijo): Promise<ResumenPagoGastoFijoDTO> {
    const dto = plainToInstance(ResumenPagoGastoFijoDTO, resumen, {
      excludeExtraneousValues: true,
    });
    
    if (resumen.infoInicial) {
      dto.infoInicial = await this.infoInicialMapper.entity2DTO(resumen.infoInicial);
    }
    
    if (resumen.usuario) {
      dto.usuario = await this.usuarioMapper.entity2DTO(resumen.usuario);
    }

    // Calcular campos derivados
    dto.montoPendiente = Number(dto.montoTotal) - Number(dto.montoPagado);
    dto.porcentajePagado = dto.montoTotal > 0 
      ? (Number(dto.montoPagado) / Number(dto.montoTotal)) * 100 
      : 0;
    
    return dto;
  }
}

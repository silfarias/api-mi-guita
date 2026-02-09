import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GastoFijoPago } from '../entities/gasto-fijo-pago.entity';
import {
  GastoFijoPagoDTO,
  PagosGastoFijoDTO,
  Pagos,
  PagoSimpleDTO,
} from '../dto/gasto-fijo-pago.dto';
import { CreateGastoFijoPagoRequestDto } from '../dto/create-gasto-fijo-pago-request.dto';
import { UpdateGastoFijoPagoRequestDto } from '../dto/update-gasto-fijo-pago-request.dto';
import { SearchGastoFijoPagoRequestDto } from '../dto/search-gasto-fijo-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { GastoFijoMapper } from './gasto-fijo.mapper';
import { InfoInicialMapper } from 'src/schematics/info-inicial/mappers/info-inicial.mapper';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { MedioPagoMapper } from 'src/schematics/medio-pago/mappers/medio-pago.mapper';

@Injectable()
export class GastoFijoPagoMapper {
  constructor(
    @Inject(forwardRef(() => GastoFijoMapper))
    private gastoFijoMapper: GastoFijoMapper,
    private infoInicialMapper: InfoInicialMapper,
    private medioPagoMapper: MedioPagoMapper

  ) {}

  async entity2DTO(gastoFijoPago: GastoFijoPago): Promise<GastoFijoPagoDTO> {
    const dto = plainToInstance(GastoFijoPagoDTO, gastoFijoPago, {
      excludeExtraneousValues: true,
    });
    
    if (gastoFijoPago.gastoFijo) {
      dto.gastoFijo = await this.gastoFijoMapper.entity2DTO(gastoFijoPago.gastoFijo);
    }
    
    if (gastoFijoPago.infoInicial) {
      dto.infoInicial = await this.infoInicialMapper.entity2DTO(gastoFijoPago.infoInicial);
    }
    
    return dto;
  }

  async page2Dto(
    request: SearchGastoFijoPagoRequestDto,
    page: PageDto<GastoFijoPago>,
  ): Promise<PageDto<GastoFijoPagoDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (gastoFijoPago) => {
        return this.entity2DTO(gastoFijoPago);
      }),
    );
    const pageDto = new PageDto<GastoFijoPagoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(
    request: CreateGastoFijoPagoRequestDto,
    gastoFijo: GastoFijo,
    infoInicial: InfoInicial,
  ): GastoFijoPago {
    const newGastoFijoPago: GastoFijoPago = new GastoFijoPago();
    newGastoFijoPago.gastoFijo = gastoFijo;
    newGastoFijoPago.infoInicial = infoInicial;
    // Usar montoPago del request si se proporciona, sino usar montoFijo si está disponible, sino será 0
    newGastoFijoPago.montoPago = request.montoPago !== undefined 
      ? request.montoPago 
      : (gastoFijo.montoFijo || 0);
    newGastoFijoPago.pagado = request.pagado !== undefined ? request.pagado : false;
    return newGastoFijoPago;
  }

  updateDTO2Entity(
    gastoFijoPago: GastoFijoPago,
    request: UpdateGastoFijoPagoRequestDto,
  ): GastoFijoPago {
    if (request.montoPago !== undefined) {
      gastoFijoPago.montoPago = request.montoPago;
    }
    if (request.pagado !== undefined) {
      gastoFijoPago.pagado = request.pagado;
    }
    return gastoFijoPago;
  }

  async toPagosGastoFijoDTO(
    infoInicial: InfoInicial,
    gastosFijos: GastoFijo[],
    gastosFijosPagos: GastoFijoPago[],
  ): Promise<PagosGastoFijoDTO> {
    const pagosPorGastoFijo = new Map(
      gastosFijosPagos.map((p) => [p.gastoFijo.id, p]),
    );

    const pagos: Pagos[] = await Promise.all(
      gastosFijos.map(async (gastoFijo) => {
        const pagoEntity = pagosPorGastoFijo.get(gastoFijo.id);
        const pago: PagoSimpleDTO = pagoEntity
          ? {
              id: pagoEntity.id,
              montoPago: Number(pagoEntity.montoPago),
              pagado: pagoEntity.pagado,
              medioPago: pagoEntity.medioPago ? await this.medioPagoMapper.entity2DTO(pagoEntity.medioPago) : undefined,
            }
          : { id: undefined, montoPago: 0, pagado: false };

        return {
          gastoFijo: await this.gastoFijoMapper.entity2DTO(gastoFijo),
          pago,
        };
      }),
    );

    const response = new PagosGastoFijoDTO();
    response.infoInicial = await this.infoInicialMapper.entity2DTO(infoInicial);
    response.pagos = pagos;
    return response;
  }
}

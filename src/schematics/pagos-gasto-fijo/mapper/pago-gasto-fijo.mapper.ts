import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PageDto } from 'src/common/dto/page.dto';
import { GastoFijoMapper } from 'src/schematics/gasto-fijo/mappers/gasto-fijo.mapper';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { InfoInicialMapper } from 'src/schematics/info-inicial/mappers/info-inicial.mapper';
import { MedioPagoMapper } from 'src/schematics/medio-pago/mappers/medio-pago.mapper';
import { MedioPago } from 'src/schematics/medio-pago/entities/medio-pago.entity';

import { PagoGastoFijo } from '../entities/pago-gasto-fijo.entity';
import {
  PagoGastoFijoDTO,
  PagosGastoFijoDTO,
  Pagos,
  PagoSimpleDTO,
} from '../dto/pago-gasto-fijo.dto';
import { CreatePagoGastoFijoRequestDto } from '../dto/create-pago-gasto-fijo-request.dto';
import { UpdatePagoGastoFijoRequestDto } from '../dto/update-pago-gasto-fijo-request.dto';
import { SearchPagoGastoFijoRequestDto } from '../dto/search-pago-gasto-fijo-request.dto';

@Injectable()
export class PagoGastoFijoMapper {
  constructor(
    @Inject(forwardRef(() => GastoFijoMapper))
    private gastoFijoMapper: GastoFijoMapper,
    private infoInicialMapper: InfoInicialMapper,
    private medioPagoMapper: MedioPagoMapper,
  ) {}

  async entity2DTO(pagoGastoFijo: PagoGastoFijo): Promise<PagoGastoFijoDTO> {
    const dto = plainToInstance(PagoGastoFijoDTO, pagoGastoFijo, {
      excludeExtraneousValues: true,
    });

    if (pagoGastoFijo.gastoFijo) {
      dto.gastoFijo = await this.gastoFijoMapper.entity2DTO(pagoGastoFijo.gastoFijo);
    }

    if (pagoGastoFijo.infoInicial) {
      dto.infoInicial = await this.infoInicialMapper.entity2DTO(pagoGastoFijo.infoInicial);
    }

    return dto;
  }

  async page2Dto(
    request: SearchPagoGastoFijoRequestDto,
    page: PageDto<PagoGastoFijo>,
  ): Promise<PageDto<PagoGastoFijoDTO>> {
    const dtos = await Promise.all(
      page.data.map(async (pagoGastoFijo) => this.entity2DTO(pagoGastoFijo)),
    );
    const pageDto = new PageDto<PagoGastoFijoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(
    request: CreatePagoGastoFijoRequestDto,
    gastoFijo: GastoFijo,
    infoInicial: InfoInicial,
  ): PagoGastoFijo {
    const newPagoGastoFijo = new PagoGastoFijo();
    newPagoGastoFijo.gastoFijo = gastoFijo;
    newPagoGastoFijo.infoInicial = infoInicial;
    newPagoGastoFijo.montoPago =
      request.montoPago !== undefined ? request.montoPago : (gastoFijo.montoFijo || 0);
    newPagoGastoFijo.pagado = request.pagado !== undefined ? request.pagado : false;
    return newPagoGastoFijo;
  }

  updateDTO2Entity(
    pagoGastoFijo: PagoGastoFijo,
    request: UpdatePagoGastoFijoRequestDto,
  ): PagoGastoFijo {
    if (request.montoPago !== undefined) {
      pagoGastoFijo.montoPago = request.montoPago;
    }
    if (request.medioPagoId !== undefined) {
      pagoGastoFijo.medioPago = request.medioPagoId ? MedioPago.fromId(request.medioPagoId) : null;
    }
    if (request.pagado !== undefined) {
      pagoGastoFijo.pagado = request.pagado;
    }
    return pagoGastoFijo;
  }

  async toPagosGastoFijoDTO(
    infoInicial: InfoInicial,
    gastosFijos: GastoFijo[],
    gastosFijosPagos: PagoGastoFijo[],
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
              medioPago: pagoEntity.medioPago
                ? await this.medioPagoMapper.entity2DTO(pagoEntity.medioPago)
                : undefined,
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

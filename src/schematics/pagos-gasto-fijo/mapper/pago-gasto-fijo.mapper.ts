import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PageDto } from 'src/common/dto/page.dto';
import { GastoFijoMapper } from 'src/schematics/gasto-fijo/mappers/gasto-fijo.mapper';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { MesEnum } from 'src/common/enums/mes-enum';

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
  ) {}

  async entity2DTO(pagoGastoFijo: PagoGastoFijo): Promise<PagoGastoFijoDTO> {
    const dto = plainToInstance(PagoGastoFijoDTO, pagoGastoFijo, {
      excludeExtraneousValues: true,
    });
    dto.monto = Number(pagoGastoFijo.monto ?? 0);
    if (pagoGastoFijo.gastoFijo) {
      dto.gastoFijo = await this.gastoFijoMapper.entity2DTO(pagoGastoFijo.gastoFijo);
    }
    return dto;
  }

  async page2Dto(
    request: SearchPagoGastoFijoRequestDto,
    page: PageDto<PagoGastoFijo>,
  ): Promise<PageDto<PagoGastoFijoDTO>> {
    const dtos = await Promise.all(
      page.data.map((pagoGastoFijo) => this.entity2DTO(pagoGastoFijo)),
    );
    const pageDto = new PageDto<PagoGastoFijoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(
    request: CreatePagoGastoFijoRequestDto,
    gastoFijo: GastoFijo,
    usuarioId: number,
  ): Promise<PagoGastoFijo> {
    const newPago = new PagoGastoFijo();
    newPago.gastoFijo = gastoFijo;
    newPago.mes = request.mes;
    newPago.anio = request.anio;
    newPago.monto =
      request.monto !== undefined ? request.monto : Number(gastoFijo.montoEstimado ?? 0);
    newPago.pagado = request.pagado ?? false;
    newPago.usuario = { id: usuarioId } as any;
    return newPago;
  }

  async updateDTO2Entity(
    pagoGastoFijo: PagoGastoFijo,
    request: UpdatePagoGastoFijoRequestDto,
  ): Promise<PagoGastoFijo> {
    if (request.monto !== undefined) {
      pagoGastoFijo.monto = request.monto;
    }
    if (request.pagado !== undefined) {
      pagoGastoFijo.pagado = request.pagado;
    }
    return pagoGastoFijo;
  }

  async toPagosGastoFijoDTO(
    anio: number,
    mes: MesEnum,
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
              monto: Number(pagoEntity.monto),
              pagado: pagoEntity.pagado,
            }
          : { id: undefined, monto: 0, pagado: false };

        return {
          gastoFijo: await this.gastoFijoMapper.entity2DTO(gastoFijo),
          pago,
        };
      }),
    );

    const response = new PagosGastoFijoDTO();
    response.anio = anio;
    response.mes = mes;
    response.pagos = pagos;
    return response;
  }
}

import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GastoFijoPago } from '../entities/gasto-fijo-pago.entity';
import { GastoFijoPagoDTO } from '../dto/gasto-fijo-pago.dto';
import { CreateGastoFijoPagoRequestDto } from '../dto/create-gasto-fijo-pago-request.dto';
import { UpdateGastoFijoPagoRequestDto } from '../dto/update-gasto-fijo-pago-request.dto';
import { SearchGastoFijoPagoRequestDto } from '../dto/search-gasto-fijo-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { GastoFijoMapper } from './gasto-fijo.mapper';
import { InfoInicialMapper } from 'src/schematics/info-inicial/mappers/info-inicial.mapper';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';

@Injectable()
export class GastoFijoPagoMapper {
  constructor(
    private gastoFijoMapper: GastoFijoMapper,
    private infoInicialMapper: InfoInicialMapper,
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
    newGastoFijoPago.pagado = request.pagado !== undefined ? request.pagado : false;
    return newGastoFijoPago;
  }

  updateDTO2Entity(
    gastoFijoPago: GastoFijoPago,
    request: UpdateGastoFijoPagoRequestDto,
  ): GastoFijoPago {
    if (request.pagado !== undefined) {
      gastoFijoPago.pagado = request.pagado;
    }
    return gastoFijoPago;
  }
}

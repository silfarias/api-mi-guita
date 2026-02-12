import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PageDto } from 'src/common/dto/page.dto';

import { MedioPago } from '../entities/medio-pago.entity';
import { MedioPagoDTO } from '../dto/medio-pago.dto';
import { CreateMedioPagoRequestDto } from '../dto/create-medio-pago-request.dto';
import { UpdateMedioPagoRequestDto } from '../dto/update-medio-pago-request.dto';
import { SearchMedioPagoRequestDto } from '../dto/search-medio-pago-request.dto';

@Injectable()
export class MedioPagoMapper {
  async entity2DTO(medioPago: MedioPago): Promise<MedioPagoDTO> {
    return plainToInstance(MedioPagoDTO, medioPago, {
      excludeExtraneousValues: true,
    });
  }

  async page2Dto(
    request: SearchMedioPagoRequestDto,
    page: PageDto<MedioPago>,
  ): Promise<PageDto<MedioPagoDTO>> {
    const dtos = await Promise.all(page.data.map((m) => this.entity2DTO(m)));
    const pageDto = new PageDto<MedioPagoDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(request: CreateMedioPagoRequestDto): MedioPago {
    const medioPago = new MedioPago();
    medioPago.nombre = request.nombre;
    medioPago.tipo = request.tipo;
    return medioPago;
  }

  updateDTO2Entity(
    medioPago: MedioPago,
    request: UpdateMedioPagoRequestDto,
  ): MedioPago {
    if (request.nombre !== undefined) {
      medioPago.nombre = request.nombre;
    }
    if (request.tipo !== undefined) {
      medioPago.tipo = request.tipo;
    }
    return medioPago;
  }
}

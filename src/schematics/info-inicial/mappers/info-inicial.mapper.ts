import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PageDto } from 'src/common/dto/page.dto';
import { UsuarioMapper } from 'src/schematics/usuario/mappers/usuario.mapper';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { MedioPagoMapper } from 'src/schematics/medio-pago/mappers/medio-pago.mapper';

import { InfoInicial } from '../entities/info-inicial.entity';
import { InfoInicialDTO } from '../dto/info-inicial.dto';
import { MedioPagoInfoDTO } from '../dto/medio-pago-info.dto';
import { CreateInfoInicialRequestDto } from '../dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from '../dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from '../dto/search-info-inicial-request.dto';

@Injectable()
export class InfoInicialMapper {
  constructor(
    private readonly usuarioMapper: UsuarioMapper,
    private readonly medioPagoMapper: MedioPagoMapper,
  ) {}

  async entity2DTO(infoInicial: InfoInicial): Promise<InfoInicialDTO> {
    const dto = plainToInstance(InfoInicialDTO, infoInicial, {
      excludeExtraneousValues: true,
    });

    const items = infoInicial.infoInicialMedioPagos ?? [];
    dto.mediosPago = await Promise.all(
      items.map(async (infoMedioPago) => {
        const medioPagoInfo = plainToInstance(MedioPagoInfoDTO, infoMedioPago, {
          excludeExtraneousValues: true,
        });
        if (infoMedioPago.medioPago) {
          medioPagoInfo.medioPago = await this.medioPagoMapper.entity2DTO(infoMedioPago.medioPago);
        }
        return medioPagoInfo;
      }),
    );
    dto.montoTotal = dto.mediosPago.reduce((total, mp) => total + Number(mp.monto), 0);

    if (infoInicial.usuario) {
      dto.usuario = await this.usuarioMapper.entity2DTO(infoInicial.usuario);
    }

    return dto;
  }

  async page2Dto(
    request: SearchInfoInicialRequestDto,
    page: PageDto<InfoInicial>,
  ): Promise<PageDto<InfoInicialDTO>> {
    const dtos = await Promise.all(page.data.map((i) => this.entity2DTO(i)));
    const pageDto = new PageDto<InfoInicialDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  createDTO2Entity(request: CreateInfoInicialRequestDto, usuario: Usuario): InfoInicial {
    const infoInicial = new InfoInicial();
    infoInicial.anio = request.anio;
    infoInicial.mes = request.mes;
    infoInicial.usuario = usuario;
    return infoInicial;
  }

  updateDTO2Entity(infoInicial: InfoInicial, request: UpdateInfoInicialRequestDto): InfoInicial {
    if (request.anio !== undefined) infoInicial.anio = request.anio;
    if (request.mes !== undefined) infoInicial.mes = request.mes;
    return infoInicial;
  }
}

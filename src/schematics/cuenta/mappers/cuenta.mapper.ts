import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Cuenta } from '../entities/cuenta.entity';
import { CuentaDTO } from '../dto/cuenta.dto';
import { CreateCuentaRequestDto } from '../dto/create-cuenta-request.dto';
import { UpdateCuentaRequestDto } from '../dto/update-cuenta-request.dto';
import { SearchCuentaRequestDto } from '../dto/search-cuenta-request.dto';
import { PageDto } from 'src/common/dto/page.dto';

@Injectable()
export class CuentaMapper {
  async entity2DTO(cuenta: Cuenta): Promise<CuentaDTO> {
    const dto = plainToInstance(CuentaDTO, cuenta, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    dto.saldoActual = Number(cuenta.saldoActual ?? 0);
    return dto;
  }

  async page2Dto(request: SearchCuentaRequestDto, page: PageDto<Cuenta>): Promise<PageDto<CuentaDTO>> {
    const dtos = await Promise.all(page.data.map((c) => this.entity2DTO(c)));
    const pageDto = new PageDto<CuentaDTO>(dtos, page.metadata.count);
    pageDto.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    pageDto.metadata.sortBy = request.sortBy;
    return pageDto;
  }

  async createDTO2Entity(request: CreateCuentaRequestDto): Promise<Partial<Cuenta>> {
    const cuenta = new Cuenta();
    cuenta.nombre = request.nombre;
    cuenta.tipo = request.tipo;
    cuenta.saldoActual = 0;
    return cuenta;
  }

  async updateDTO2Entity(cuenta: Cuenta, request: UpdateCuentaRequestDto): Promise<Cuenta> {
    if (request.nombre !== undefined) cuenta.nombre = request.nombre;
    if (request.tipo !== undefined) cuenta.tipo = request.tipo;
    return cuenta;
  }
}

import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Presupuesto } from '../entities/presupuesto.entity';
import { PresupuestoDTO } from '../dto/presupuesto.dto';
import { CreatePresupuestoRequestDto } from '../dto/create-presupuesto-request.dto';
import { UpdatePresupuestoRequestDto } from '../dto/update-presupuesto-request.dto';

@Injectable()
export class PresupuestoMapper {
  async entity2DTO(p: Presupuesto): Promise<PresupuestoDTO> {
    const dto = plainToInstance(PresupuestoDTO, p, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    dto.categoriaId = p.categoria?.id ?? 0;
    dto.categoriaNombre = p.categoria?.nombre ?? '';
    dto.monto = Number(p.monto ?? 0);
    return dto;
  }

  async createDTO2Entity(
    request: CreatePresupuestoRequestDto,
  ): Promise<Partial<Presupuesto>> {
    const presupuesto = new Presupuesto();
    presupuesto.mes = request.mes;
    presupuesto.anio = request.anio;
    presupuesto.monto = request.monto;
    return presupuesto;
  }

  async updateDTO2Entity(
    entity: Presupuesto,
    request: UpdatePresupuestoRequestDto,
  ): Promise<Presupuesto> {
    if (request.mes !== undefined) entity.mes = request.mes;
    if (request.anio !== undefined) entity.anio = request.anio;
    if (request.monto !== undefined) entity.monto = request.monto;
    return entity;
  }
}

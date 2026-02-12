import { Injectable, HttpException } from '@nestjs/common';

import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';

import { MedioPago } from './entities/medio-pago.entity';
import { MedioPagoMapper } from './mappers/medio-pago.mapper';
import { MedioPagoRepository } from './repository/medio-pago.repository';
import { MedioPagoDTO } from './dto/medio-pago.dto';
import { CreateMedioPagoRequestDto } from './dto/create-medio-pago-request.dto';
import { UpdateMedioPagoRequestDto } from './dto/update-medio-pago-request.dto';
import { SearchMedioPagoRequestDto } from './dto/search-medio-pago-request.dto';

@Injectable()
export class MedioPagoService {
  constructor(
    private readonly medioPagoMapper: MedioPagoMapper,
    private readonly medioPagoRepository: MedioPagoRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findById(id: number): Promise<MedioPagoDTO> {
    try {
      const medioPago = await this.getEntityService.findById(MedioPago, id);
      return this.medioPagoMapper.entity2DTO(medioPago);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async search(request: SearchMedioPagoRequestDto): Promise<PageDto<MedioPagoDTO>> {
    try {
      const page = await this.medioPagoRepository.search(request);
      return this.medioPagoMapper.page2Dto(request, page);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async create(request: CreateMedioPagoRequestDto): Promise<MedioPagoDTO> {
    try {
      await this.validateUniqueNombre(request.nombre);

      const newMedioPago = this.medioPagoMapper.createDTO2Entity(request);
      const saved = await this.medioPagoRepository.save(newMedioPago);

      const withRelations = await this.getEntityService.findById(MedioPago, saved.id);
      return this.medioPagoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(id: number, request: UpdateMedioPagoRequestDto): Promise<MedioPagoDTO> {
    try {
      const medioPago = await this.getEntityService.findById(MedioPago, id);

      if (request.nombre !== undefined && request.nombre !== medioPago.nombre) {
        await this.validateUniqueNombre(request.nombre);
      }

      const updated = this.medioPagoMapper.updateDTO2Entity(medioPago, request);
      await this.medioPagoRepository.save(updated);

      const withRelations = await this.getEntityService.findById(MedioPago, id);
      return this.medioPagoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number): Promise<string> {
    try {
      const medioPago = await this.getEntityService.findById(MedioPago, id);
      await this.medioPagoRepository.softRemove(medioPago);
      return 'Medio de pago eliminado correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  /** Alias para compatibilidad: obtener medio de pago por ID como DTO */
  findOne(id: number): Promise<MedioPagoDTO> {
    return this.findById(id);
  }

  private async validateUniqueNombre(nombre: string): Promise<void> {
    const existing = await this.medioPagoRepository.findOne({
      where: { nombre },
    });
    if (existing) {
      this.errorHandler.throwConflict(
        ERRORS.ENTITY.NAME_ALREADY_EXISTS,
        `El medio de pago "${nombre}" ya está registrado`,
      );
    }
  }
}

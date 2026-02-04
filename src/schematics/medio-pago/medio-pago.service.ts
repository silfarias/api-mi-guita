import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMedioPagoRequestDto } from './dto/create-medio-pago-request.dto';
import { UpdateMedioPagoRequestDto } from './dto/update-medio-pago-request.dto';
import { SearchMedioPagoRequestDto } from './dto/search-medio-pago-request.dto';
import { MedioPagoDTO } from './dto/medio-pago.dto';
import { MedioPagoMapper } from './mappers/medio-pago.mapper';
import { MedioPagoRepository } from './repository/medio-pago.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class MedioPagoService {
  constructor(
    private medioPagoMapper: MedioPagoMapper,
    private medioPagoRepository: MedioPagoRepository,
  ) {}

  async findOne(id: number): Promise<MedioPagoDTO> {
    const medioPago = await this.medioPagoRepository.findOneById(id);
    return await this.medioPagoMapper.entity2DTO(medioPago);
  }

  async search(request: SearchMedioPagoRequestDto): Promise<PageDto<MedioPagoDTO>> {
    const medioPagoPage = await this.medioPagoRepository.search(request);
    return this.medioPagoMapper.page2Dto(request, medioPagoPage);
  }

  async create(request: CreateMedioPagoRequestDto): Promise<MedioPagoDTO> {
    try {
      // Validar que no exista un medio de pago con el mismo nombre
      const existingMedioPago = await this.medioPagoRepository.findOne({
        where: {
          nombre: request.nombre,
        },
      });

      if (existingMedioPago) {
        throw new BadRequestException({
          code: ERRORS.ENTITY.NAME_ALREADY_EXISTS.CODE,
          message: 'Ya existe un medio de pago con ese nombre',
          details: `El medio de pago "${request.nombre}" ya está registrado`,
        });
      }

      // Crear el medio de pago
      const newMedioPago = this.medioPagoMapper.createDTO2Entity(request);
      const medioPagoSaved = await this.medioPagoRepository.save(newMedioPago);

      // Buscar el medio de pago guardado
      const searchMedioPago = await this.medioPagoRepository.findOne({
        where: { id: medioPagoSaved.id },
      });

      if (!searchMedioPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: medioPagoSaved.id }),
        });
      }

      return this.medioPagoMapper.entity2DTO(searchMedioPago);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async update(
    id: number,
    request: UpdateMedioPagoRequestDto,
  ): Promise<MedioPagoDTO> {
    try {
      // Verificar que el medio de pago existe
      const medioPago = await this.medioPagoRepository.findOne({
        where: { id: id },
      });

      if (!medioPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      // Si se está cambiando el nombre, validar que no exista otro medio de pago con ese nombre
      if (request.nombre && request.nombre !== medioPago.nombre) {
        const existingMedioPago = await this.medioPagoRepository.findOne({
          where: {
            nombre: request.nombre,
          },
        });

        if (existingMedioPago) {
          throw new BadRequestException({
            code: ERRORS.ENTITY.NAME_ALREADY_EXISTS.CODE,
            message: 'Ya existe un medio de pago con ese nombre',
            details: `El medio de pago "${request.nombre}" ya está registrado`,
          });
        }
      }

      // Actualizar el medio de pago
      const updateMedioPago = this.medioPagoMapper.updateDTO2Entity(medioPago, request);
      await this.medioPagoRepository.save(updateMedioPago);

      // Buscar el medio de pago actualizado
      const searchMedioPago = await this.medioPagoRepository.findOne({
        where: { id: id },
      });

      if (!searchMedioPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.medioPagoMapper.entity2DTO(searchMedioPago);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async remove(id: number): Promise<string> {
    const medioPago = await this.medioPagoRepository.findOne({
      where: { id: id },
    });

    if (!medioPago) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    await this.medioPagoRepository.softRemove(medioPago);
    return 'Medio de pago eliminado correctamente';
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateGastoFijoPagoRequestDto } from './dto/create-gasto-fijo-pago-request.dto';
import { UpdateGastoFijoPagoRequestDto } from './dto/update-gasto-fijo-pago-request.dto';
import { SearchGastoFijoPagoRequestDto } from './dto/search-gasto-fijo-pago-request.dto';
import { GastoFijoPagoDTO } from './dto/gasto-fijo-pago.dto';
import { GastoFijoPagoMapper } from './mappers/gasto-fijo-pago.mapper';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';

@Injectable()
export class GastoFijoPagoService {
  constructor(
    private gastoFijoPagoMapper: GastoFijoPagoMapper,
    private gastoFijoPagoRepository: GastoFijoPagoRepository,
    private gastoFijoRepository: GastoFijoRepository,
    private infoInicialRepository: InfoInicialRepository,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<GastoFijoPagoDTO> {
    const gastoFijoPago = await this.gastoFijoPagoRepository.findOne({
      where: { id: id },
      relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });

    if (!gastoFijoPago) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    // Verificar que pertenece al usuario
    if (gastoFijoPago.gastoFijo.usuario.id !== usuarioId || gastoFijoPago.infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para ver este gasto fijo pago',
        details: JSON.stringify({ id }),
      });
    }

    return await this.gastoFijoPagoMapper.entity2DTO(gastoFijoPago);
  }

  async search(request: SearchGastoFijoPagoRequestDto, usuarioId: number): Promise<PageDto<GastoFijoPagoDTO>> {
    const gastoFijoPagoPage = await this.gastoFijoPagoRepository.search(request, usuarioId);
    return this.gastoFijoPagoMapper.page2Dto(request, gastoFijoPagoPage);
  }

  async create(request: CreateGastoFijoPagoRequestDto, usuarioId: number): Promise<GastoFijoPagoDTO> {
    try {
      // Validar que el gasto fijo existe y pertenece al usuario
      const gastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: request.gastoFijoId },
        relations: ['usuario'],
      });

      if (!gastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Gasto fijo no encontrado',
          details: JSON.stringify({ gastoFijoId: request.gastoFijoId }),
        });
      }

      if (gastoFijo.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para crear pagos de este gasto fijo',
          details: JSON.stringify({ gastoFijoId: request.gastoFijoId }),
        });
      }

      // Validar que la información inicial existe y pertenece al usuario
      const infoInicial = await this.infoInicialRepository.findOne({
        where: { id: request.infoInicialId },
        relations: ['usuario'],
      });

      if (!infoInicial) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Información inicial no encontrada',
          details: JSON.stringify({ infoInicialId: request.infoInicialId }),
        });
      }

      if (infoInicial.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para crear pagos en esta información inicial',
          details: JSON.stringify({ infoInicialId: request.infoInicialId }),
        });
      }

      // Verificar que no existe ya un registro para este gasto fijo y mes
      const existente = await this.gastoFijoPagoRepository.findByGastoFijoAndInfoInicial(
        request.gastoFijoId,
        request.infoInicialId,
      );

      if (existente) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Ya existe un registro de pago para este gasto fijo en este mes',
          details: JSON.stringify({ gastoFijoId: request.gastoFijoId, infoInicialId: request.infoInicialId }),
        });
      }

      // Crear el gasto fijo pago
      const newGastoFijoPago = this.gastoFijoPagoMapper.createDTO2Entity(request, gastoFijo, infoInicial);
      const gastoFijoPagoSaved = await this.gastoFijoPagoRepository.save(newGastoFijoPago);

      // Buscar el gasto fijo pago guardado con relaciones
      const searchGastoFijoPago = await this.gastoFijoPagoRepository.findOne({
        where: { id: gastoFijoPagoSaved.id },
        relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
      });

      if (!searchGastoFijoPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: gastoFijoPagoSaved.id }),
        });
      }

      return this.gastoFijoPagoMapper.entity2DTO(searchGastoFijoPago);
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
    request: UpdateGastoFijoPagoRequestDto,
    usuarioId: number,
  ): Promise<GastoFijoPagoDTO> {
    try {
      // Verificar que el gasto fijo pago existe y pertenece al usuario
      const gastoFijoPago = await this.gastoFijoPagoRepository.findOne({
        where: { id: id },
        relations: ['gastoFijo', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
      });

      if (!gastoFijoPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      if (gastoFijoPago.gastoFijo.usuario.id !== usuarioId || gastoFijoPago.infoInicial.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para modificar este gasto fijo pago',
          details: JSON.stringify({ id }),
        });
      }

      // Actualizar el gasto fijo pago
      const updateGastoFijoPago = this.gastoFijoPagoMapper.updateDTO2Entity(gastoFijoPago, request);
      await this.gastoFijoPagoRepository.save(updateGastoFijoPago);

      // Buscar el gasto fijo pago actualizado
      const searchGastoFijoPago = await this.gastoFijoPagoRepository.findOne({
        where: { id: id },
        relations: ['gastoFijo', 'gastoFijo.categoria', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
      });

      if (!searchGastoFijoPago) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.gastoFijoPagoMapper.entity2DTO(searchGastoFijoPago);
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

  async remove(id: number, usuarioId: number): Promise<string> {
    const gastoFijoPago = await this.gastoFijoPagoRepository.findOne({
      where: { id: id },
      relations: ['gastoFijo', 'gastoFijo.usuario', 'infoInicial', 'infoInicial.usuario'],
    });

    if (!gastoFijoPago) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (gastoFijoPago.gastoFijo.usuario.id !== usuarioId || gastoFijoPago.infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar este gasto fijo pago',
        details: JSON.stringify({ id }),
      });
    }

    await this.gastoFijoPagoRepository.softRemove(gastoFijoPago);
    return 'Gasto fijo pago eliminado correctamente';
  }
}

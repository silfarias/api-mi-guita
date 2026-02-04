import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateInfoInicialRequestDto } from './dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from './dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from './dto/search-info-inicial-request.dto';
import { InfoInicialDTO } from './dto/info-inicial.dto';
import { InfoInicialMapper } from './mappers/info-inicial.mapper';
import { InfoInicialRepository } from './repository/info-inicial.repository';
import { InfoInicialMedioPagoRepository } from './repository/info-inicial-mediopago.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { InfoInicial } from './entities/info-inicial.entity';
import { InfoInicialMedioPago } from './entities/info-inicial-mediopago.entity';
import { ERRORS } from 'src/common/errors/errors-codes';
import { UsuarioRepository } from '../usuario/repository/usuario.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';

@Injectable()
export class InfoInicialService {
  constructor(
    private infoInicialMapper: InfoInicialMapper,
    private infoInicialRepository: InfoInicialRepository,
    private infoInicialMedioPagoRepository: InfoInicialMedioPagoRepository,
    private usuarioRepository: UsuarioRepository,
    private medioPagoRepository: MedioPagoRepository,
  ) {}

  async findOne(id: number): Promise<InfoInicialDTO> {
    const infoInicial = await this.infoInicialRepository.findOneById(id);
    return await this.infoInicialMapper.entity2DTO(infoInicial);
  }

  async search(request: SearchInfoInicialRequestDto): Promise<PageDto<InfoInicialDTO>> {
    const infoInicialPage = await this.infoInicialRepository.search(request);
    return await this.infoInicialMapper.page2Dto(request, infoInicialPage);
  }

  async findByUsuarioAutenticado(usuarioId: number): Promise<PageDto<InfoInicialDTO>> {
    const request = new SearchInfoInicialRequestDto();
    request.usuarioId = usuarioId;
    const infoInicialPage = await this.infoInicialRepository.search(request);
    return await this.infoInicialMapper.page2Dto(request, infoInicialPage);
  }

  async create(request: CreateInfoInicialRequestDto, usuarioId: number): Promise<InfoInicialDTO> {
    try {
      // Validar que el usuario existe
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Usuario no encontrado',
          details: JSON.stringify({ usuarioId }),
        });
      }

      // Validar que no exista ya una info inicial para el mismo usuario, año y mes
      const existingInfo = await this.infoInicialRepository.findByUsuarioAndMes(
        usuarioId,
        request.anio,
        request.mes,
      );

      if (existingInfo) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Ya existe información inicial para este usuario, año y mes',
          details: JSON.stringify({ usuarioId, anio: request.anio, mes: request.mes }),
        });
      }

      // Validar que todos los medios de pago existen
      const medioPagoIds = request.mediosPago.map(mp => mp.medioPagoId);
      const mediosPagoExistentes = await this.medioPagoRepository
        .createQueryBuilder('medioPago')
        .where('medioPago.id IN (:...ids)', { ids: medioPagoIds })
        .getMany();
      
      if (mediosPagoExistentes.length !== medioPagoIds.length) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'Uno o más medios de pago no existen',
          details: JSON.stringify({ medioPagoIds }),
        });
      }

      // Validar que no haya medios de pago duplicados
      const medioPagoIdsUnicos = new Set(medioPagoIds);
      if (medioPagoIdsUnicos.size !== medioPagoIds.length) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No se pueden repetir medios de pago',
          details: 'Cada medio de pago solo puede aparecer una vez',
        });
      }

      // Crear la información inicial
      const newInfoInicial = this.infoInicialMapper.createDTO2Entity(request, usuario);
      const infoInicialSaved = await this.infoInicialRepository.save(newInfoInicial);

      // Crear los registros de InfoInicialMedioPago
      const infoInicialMedioPagos: InfoInicialMedioPago[] = request.mediosPago.map(mp => {
        const infoMedioPago = new InfoInicialMedioPago();
        infoMedioPago.infoInicial = infoInicialSaved;
        infoMedioPago.medioPago = mediosPagoExistentes.find(m => m.id === mp.medioPagoId)!;
        infoMedioPago.monto = mp.monto;
        return infoMedioPago;
      });

      await this.infoInicialMedioPagoRepository.save(infoInicialMedioPagos);

      // Buscar la información inicial guardada con relaciones
      const searchInfoInicial = await this.infoInicialRepository.findOne({
        where: { id: infoInicialSaved.id },
        relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
      });

      if (!searchInfoInicial) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: infoInicialSaved.id }),
        });
      }

      return this.infoInicialMapper.entity2DTO(searchInfoInicial);
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
    request: UpdateInfoInicialRequestDto,
    usuarioId: number,
  ): Promise<InfoInicialDTO> {
    try {
      // Verificar que la información inicial existe y pertenece al usuario
      const infoInicial = await this.infoInicialRepository.findOne({
        where: { id: id },
        relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
      });

      if (!infoInicial) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      if (infoInicial.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
          details: 'No tienes permiso para modificar esta información inicial',
        });
      }

      // Si se está cambiando el año o mes, validar que no exista otra info inicial con esos valores
      if (request.anio || request.mes) {
        const newAnio = request.anio || infoInicial.anio;
        const newMes = request.mes || infoInicial.mes;

        const existingInfo = await this.infoInicialRepository.findByUsuarioAndMes(
          usuarioId,
          newAnio,
          newMes,
        );

        if (existingInfo && existingInfo.id !== id) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Ya existe información inicial para este usuario, año y mes',
            details: JSON.stringify({ usuarioId, anio: newAnio, mes: newMes }),
          });
        }
      }

      // Actualizar la información inicial
      const updateInfoInicial = this.infoInicialMapper.updateDTO2Entity(infoInicial, request);
      await this.infoInicialRepository.save(updateInfoInicial);

      // Si se proporcionan nuevos medios de pago, actualizar los existentes
      if (request.mediosPago && request.mediosPago.length > 0) {
        // Validar que todos los medios de pago existen
        const medioPagoIds = request.mediosPago.map(mp => mp.medioPagoId);
        const mediosPagoExistentes = await this.medioPagoRepository
          .createQueryBuilder('medioPago')
          .where('medioPago.id IN (:...ids)', { ids: medioPagoIds })
          .getMany();
        
        if (mediosPagoExistentes.length !== medioPagoIds.length) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Uno o más medios de pago no existen',
            details: JSON.stringify({ medioPagoIds }),
          });
        }

        // Validar que no haya medios de pago duplicados
        const medioPagoIdsUnicos = new Set(medioPagoIds);
        if (medioPagoIdsUnicos.size !== medioPagoIds.length) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'No se pueden repetir medios de pago',
            details: 'Cada medio de pago solo puede aparecer una vez',
          });
        }

        // Eliminar los medios de pago existentes con soft delete
        if (infoInicial.infoInicialMedioPagos && infoInicial.infoInicialMedioPagos.length > 0) {
          await this.infoInicialMedioPagoRepository.softRemove(infoInicial.infoInicialMedioPagos);
        }

        // Crear los nuevos registros de InfoInicialMedioPago
        const infoInicialMedioPagos: InfoInicialMedioPago[] = request.mediosPago.map(mp => {
          const infoMedioPago = new InfoInicialMedioPago();
          infoMedioPago.infoInicial = updateInfoInicial;
          infoMedioPago.medioPago = mediosPagoExistentes.find(m => m.id === mp.medioPagoId)!;
          infoMedioPago.monto = mp.monto;
          return infoMedioPago;
        });

        await this.infoInicialMedioPagoRepository.save(infoInicialMedioPagos);
      }

      // Buscar la información inicial actualizada
      const searchInfoInicial = await this.infoInicialRepository.findOne({
        where: { id: id },
        relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
      });

      if (!searchInfoInicial) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.infoInicialMapper.entity2DTO(searchInfoInicial);
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
    const infoInicial = await this.infoInicialRepository.findOne({
      where: { id: id },
      relations: ['usuario'],
    });

    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar esta información inicial',
        details: JSON.stringify({ id }),
      });
    }

    await this.infoInicialRepository.softRemove(infoInicial);
    return 'Información inicial eliminada correctamente';
  }

  async findByUsuarioAndMes(usuarioId: number, anio: number, mes: string): Promise<InfoInicialDTO | null> {
    const infoInicial = await this.infoInicialRepository.findByUsuarioAndMes(usuarioId, anio, mes);
    if (!infoInicial) {
      return null;
    }
    return await this.infoInicialMapper.entity2DTO(infoInicial);
  }
}

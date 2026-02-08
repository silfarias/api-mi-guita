import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateGastoFijoPagoRequestDto } from './dto/create-gasto-fijo-pago-request.dto';
import { UpdateGastoFijoPagoRequestDto } from './dto/update-gasto-fijo-pago-request.dto';
import { SearchGastoFijoPagoRequestDto } from './dto/search-gasto-fijo-pago-request.dto';
import { GastoFijoPagoDTO, PagosGastoFijoDTO } from './dto/gasto-fijo-pago.dto';
import { GastoFijoPagoMapper } from './mappers/gasto-fijo-pago.mapper';
import { GastoFijoPagoRepository } from './repository/gasto-fijo-pago.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { ResumenPagoGastoFijoService } from './resumen-pago-gasto-fijo.service';
import { EntityManager } from 'typeorm';
import { InfoInicial } from '../info-inicial/entities/info-inicial.entity';
import { GastoFijoPago } from './entities/gasto-fijo-pago.entity';

@Injectable()
export class GastoFijoPagoService {
  constructor(
    private gastoFijoPagoMapper: GastoFijoPagoMapper,
    private gastoFijoPagoRepository: GastoFijoPagoRepository,
    private gastoFijoRepository: GastoFijoRepository,
    private infoInicialRepository: InfoInicialRepository,
    @Inject(forwardRef(() => ResumenPagoGastoFijoService))
    private resumenPagoGastoFijoService: ResumenPagoGastoFijoService,
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

  async getPagosPorInfoInicial(
    infoInicialId: number,
    usuarioId: number,
  ): Promise<PagosGastoFijoDTO> {
    const infoInicial = await this.infoInicialRepository.findOne({
      where: { id: infoInicialId },
      relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });

    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Información inicial no encontrada',
        details: JSON.stringify({ infoInicialId }),
      });
    }

    if (infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para acceder a esta información inicial',
        details: JSON.stringify({ infoInicialId }),
      });
    }

    const [gastosFijosActivos, gastosFijosPagos] = await Promise.all([
      this.gastoFijoRepository.getGastosFijosActivos(usuarioId),
      this.gastoFijoPagoRepository.findByInfoInicialIdAndUsuario(infoInicialId, usuarioId),
    ]);

    return this.gastoFijoPagoMapper.toPagosGastoFijoDTO(
      infoInicial,
      gastosFijosActivos,
      gastosFijosPagos,
    );
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

      // Crear el gasto fijo pago (el mapper maneja el montoPago automáticamente)
      const newGastoFijoPago = this.gastoFijoPagoMapper.createDTO2Entity(request, gastoFijo, infoInicial);
      const gastoFijoPagoSaved = await this.gastoFijoPagoRepository.save(newGastoFijoPago);

      // Recalcular el resumen de pagos de gastos fijos automáticamente
      await this.resumenPagoGastoFijoService.recalcularResumen(infoInicial.id);

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

      // Si se está marcando como pagado pero no se proporciona montoPago: usar montoFijo si existe y > 0, sino exigir que se envíe montoPago
      if (request.pagado === true && request.montoPago === undefined) {
        const montoFijo = gastoFijoPago.gastoFijo.montoFijo != null ? Number(gastoFijoPago.gastoFijo.montoFijo) : 0;
        if (montoFijo > 0 && gastoFijoPago.montoPago === 0) {
          request.montoPago = montoFijo;
        } else if (gastoFijoPago.montoPago === 0) {
          throw new BadRequestException({
            code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
            message: 'Debe proporcionar el monto pagado antes de marcar como pagado',
            details: 'El campo montoPago es requerido cuando se marca como pagado y el gasto fijo no tiene monto fijo',
          });
        }
      }

      // Actualizar el gasto fijo pago
      const updateGastoFijoPago = this.gastoFijoPagoMapper.updateDTO2Entity(gastoFijoPago, request);
      await this.gastoFijoPagoRepository.save(updateGastoFijoPago);

      // Recalcular el resumen de pagos de gastos fijos automáticamente
      await this.resumenPagoGastoFijoService.recalcularResumen(gastoFijoPago.infoInicial.id);

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

  public async crearGastosFijosPagosAutomaticos(
    infoInicial: InfoInicial,
    usuarioId: number,
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const gastosFijosActivos = await this.gastoFijoRepository.getGastosFijosActivos(usuarioId);
      if (gastosFijosActivos.length === 0) {
        return;
      }
      const idsConPago = await this.gastoFijoPagoRepository.getGastosFijosIdsConPago(infoInicial.id);
      const gastosFijosIdsConPago = new Set(idsConPago);

      const gastosFijosPagos: GastoFijoPago[] = gastosFijosActivos
        .filter((gastoFijo) => !gastosFijosIdsConPago.has(gastoFijo.id))
        .map((gastoFijo) => {
          const gastoFijoPago = new GastoFijoPago();
          gastoFijoPago.gastoFijo = gastoFijo;
          gastoFijoPago.infoInicial = infoInicial;
          gastoFijoPago.montoPago = 0;
          gastoFijoPago.pagado = false;
          return gastoFijoPago;
        });

      if (gastosFijosPagos.length > 0) {
        if (manager) {
          await manager.getRepository(GastoFijoPago).save(gastosFijosPagos);
        } else {
          await this.gastoFijoPagoRepository.save(gastosFijosPagos);
        }
      }
    } catch (error) {
      console.error('Error al crear pagos automáticos de gastos fijos:', error);
      throw error;
    }
  }
}

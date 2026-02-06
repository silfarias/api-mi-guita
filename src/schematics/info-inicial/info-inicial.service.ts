import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateInfoInicialRequestDto } from './dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from './dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from './dto/search-info-inicial-request.dto';
import { InfoInicialDTO } from './dto/info-inicial.dto';
import { SaldosActualesDTO, SaldoActualDTO } from './dto/saldos-actuales.dto';
import { InfoInicialMapper } from './mappers/info-inicial.mapper';
import { InfoInicialRepository } from './repository/info-inicial.repository';
import { InfoInicialMedioPagoRepository } from './repository/info-inicial-mediopago.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { InfoInicial } from './entities/info-inicial.entity';
import { InfoInicialMedioPago } from './entities/info-inicial-mediopago.entity';
import { ERRORS } from 'src/common/errors/errors-codes';
import { UsuarioRepository } from '../usuario/repository/usuario.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { MedioPagoMapper } from '../medio-pago/mappers/medio-pago.mapper';
import { GastoFijoRepository } from '../gasto-fijo/repository/gasto-fijo.repository';
import { GastoFijoPagoRepository } from '../gasto-fijo/repository/gasto-fijo-pago.repository';
import { GastoFijoPago } from '../gasto-fijo/entities/gasto-fijo-pago.entity';
import { ResumenPagoGastoFijoService } from '../gasto-fijo/resumen-pago-gasto-fijo.service';

@Injectable()
export class InfoInicialService {
  constructor(
    private infoInicialMapper: InfoInicialMapper,
    private infoInicialRepository: InfoInicialRepository,
    private infoInicialMedioPagoRepository: InfoInicialMedioPagoRepository,
    private usuarioRepository: UsuarioRepository,
    private medioPagoRepository: MedioPagoRepository,
    private movimientoRepository: MovimientoRepository,
    private medioPagoMapper: MedioPagoMapper,
    @Inject(forwardRef(() => GastoFijoRepository))
    private gastoFijoRepository: GastoFijoRepository,
    @Inject(forwardRef(() => GastoFijoPagoRepository))
    private gastoFijoPagoRepository: GastoFijoPagoRepository,
    @Inject(forwardRef(() => ResumenPagoGastoFijoService))
    private resumenPagoGastoFijoService: ResumenPagoGastoFijoService,
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

      // Crear automáticamente los registros de GastoFijoPago para todos los gastos fijos del usuario
      await this.crearGastosFijosPagosAutomaticos(infoInicialSaved, usuarioId);

      // Crear e inicializar el resumen de pagos de gastos fijos
      await this.resumenPagoGastoFijoService.crearOInicializarResumen(infoInicialSaved.id, usuarioId);

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

  async calcularSaldosActuales(id: number, usuarioId: number): Promise<SaldosActualesDTO> {
    // Verificar que la información inicial existe y pertenece al usuario
    const infoInicial = await this.infoInicialRepository.findOne({
      where: { id: id },
      relations: ['usuario', 'infoInicialMedioPagos', 'infoInicialMedioPagos.medioPago'],
    });

    if (!infoInicial) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: 'Información inicial no encontrada',
        details: JSON.stringify({ id }),
      });
    }

    if (infoInicial.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para ver los saldos de esta información inicial',
        details: JSON.stringify({ id }),
      });
    }

    // Obtener todos los movimientos de esta información inicial
    const movimientos = await this.movimientoRepository.find({
      where: { infoInicial: { id: infoInicial.id } },
      relations: ['medioPago'],
    });

    // Calcular saldos por medio de pago
    const saldosMap = new Map<number, SaldoActualDTO>();

    // Inicializar saldos con los montos iniciales
    if (infoInicial.infoInicialMedioPagos) {
      for (const infoMedioPago of infoInicial.infoInicialMedioPagos) {
        const medioPagoDTO = await this.medioPagoMapper.entity2DTO(infoMedioPago.medioPago);
        saldosMap.set(infoMedioPago.medioPago.id, {
          medioPago: medioPagoDTO,
          saldoInicial: Number(infoMedioPago.monto),
          totalIngresos: 0,
          totalEgresos: 0,
          saldoActual: Number(infoMedioPago.monto),
        });
      }
    }

    // Calcular movimientos por medio de pago
    for (const movimiento of movimientos) {
      if (movimiento.medioPago && movimiento.medioPago.id) {
        const medioPagoId = movimiento.medioPago.id;
        
        if (!saldosMap.has(medioPagoId)) {
          const medioPagoDTO = await this.medioPagoMapper.entity2DTO(movimiento.medioPago);
          saldosMap.set(medioPagoId, {
            medioPago: medioPagoDTO,
            saldoInicial: 0,
            totalIngresos: 0,
            totalEgresos: 0,
            saldoActual: 0,
          });
        }

        const saldo = saldosMap.get(medioPagoId)!;
        const monto = Number(movimiento.monto);

        if (movimiento.tipoMovimiento === TipoMovimientoEnum.INGRESO) {
          saldo.totalIngresos += monto;
        } else {
          saldo.totalEgresos += monto;
        }
      }
    }

    // Calcular saldos actuales
    for (const saldo of saldosMap.values()) {
      saldo.saldoActual = saldo.saldoInicial + saldo.totalIngresos - saldo.totalEgresos;
    }

    const saldosPorMedioPago = Array.from(saldosMap.values());
    const balanceTotal = saldosPorMedioPago.reduce((sum, saldo) => sum + saldo.saldoActual, 0);

    return {
      saldosPorMedioPago,
      balanceTotal,
    };
  }

  /**
   * Crea automáticamente los registros de GastoFijoPago para todos los gastos fijos activos del usuario
   * cuando se crea una nueva InfoInicial (nuevo mes/año)
   */
  private async crearGastosFijosPagosAutomaticos(infoInicial: InfoInicial, usuarioId: number): Promise<void> {
    try {
      // Buscar todos los gastos fijos activos del usuario usando QueryBuilder para filtrar deleted_date
      const gastosFijosActivos = await this.gastoFijoRepository
        .createQueryBuilder('gastoFijo')
        .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
        .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
        .where('usuario.id = :usuarioId', { usuarioId })
        .andWhere('gastoFijo.deleted_date IS NULL')
        .getMany();

      if (gastosFijosActivos.length === 0) {
        // Si no hay gastos fijos, no hay nada que crear
        return;
      }

      // Verificar si ya existen pagos para esta InfoInicial (evitar duplicados)
      const pagosExistentes = await this.gastoFijoPagoRepository
        .createQueryBuilder('gastoFijoPago')
        .leftJoinAndSelect('gastoFijoPago.gastoFijo', 'gastoFijo')
        .where('gastoFijoPago.infoInicial = :infoInicialId', { infoInicialId: infoInicial.id })
        .getMany();

      const gastosFijosIdsConPago = new Set(pagosExistentes.map(p => p.gastoFijo.id));

      // Crear un GastoFijoPago solo para los gastos fijos que aún no tienen pago para esta InfoInicial
      const gastosFijosPagos: GastoFijoPago[] = gastosFijosActivos
        .filter(gastoFijo => !gastosFijosIdsConPago.has(gastoFijo.id))
        .map(gastoFijo => {
          const gastoFijoPago = new GastoFijoPago();
          gastoFijoPago.gastoFijo = gastoFijo;
          gastoFijoPago.infoInicial = infoInicial;
          // Si el gasto fijo tiene montoFijo, usarlo como montoPago inicial, sino será 0 hasta que el usuario lo actualice
          gastoFijoPago.montoPago = gastoFijo.montoFijo || 0;
          gastoFijoPago.pagado = false;
          return gastoFijoPago;
        });

      if (gastosFijosPagos.length > 0) {
        // Guardar todos los pagos en una sola transacción
        await this.gastoFijoPagoRepository.save(gastosFijosPagos);
      }
    } catch (error) {
      // Si hay un error al crear los pagos automáticos, lo registramos pero no fallamos la creación de InfoInicial
      // Esto permite que el usuario pueda crear la InfoInicial aunque haya un problema con los gastos fijos
      console.error('Error al crear pagos automáticos de gastos fijos:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
}

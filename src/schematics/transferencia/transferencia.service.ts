import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTransferenciaRequestDto } from './dto/create-transferencia-request.dto';
import { TransferenciaDTO } from './dto/transferencia.dto';
import { InfoInicialRepository } from '../info-inicial/repository/info-inicial.repository';
import { MovimientoRepository } from '../movimiento/repository/movimiento.repository';
import { MedioPagoRepository } from '../medio-pago/repository/medio-pago.repository';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { MovimientoMapper } from '../movimiento/mappers/movimiento.mapper';
import { ERRORS } from 'src/common/errors/errors-codes';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { Movimiento } from '../movimiento/entities/movimiento.entity';

@Injectable()
export class TransferenciaService {
  constructor(
    private infoInicialRepository: InfoInicialRepository,
    private movimientoRepository: MovimientoRepository,
    private medioPagoRepository: MedioPagoRepository,
    private categoriaRepository: CategoriaRepository,
    private movimientoMapper: MovimientoMapper,
  ) {}

  async crearTransferencia(request: CreateTransferenciaRequestDto, usuarioId: number): Promise<TransferenciaDTO> {
    try {
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
          message: 'No tienes permiso para crear transferencias en esta información inicial',
          details: JSON.stringify({ infoInicialId: request.infoInicialId }),
        });
      }

      // Validar que los medios de pago existen
      const medioPagoOrigen = await this.medioPagoRepository.findOne({
        where: { id: request.medioPagoOrigenId },
      });

      if (!medioPagoOrigen) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Medio de pago origen no encontrado',
          details: JSON.stringify({ medioPagoOrigenId: request.medioPagoOrigenId }),
        });
      }

      const medioPagoDestino = await this.medioPagoRepository.findOne({
        where: { id: request.medioPagoDestinoId },
      });

      if (!medioPagoDestino) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Medio de pago destino no encontrado',
          details: JSON.stringify({ medioPagoDestinoId: request.medioPagoDestinoId }),
        });
      }

      // Validar que origen y destino sean diferentes
      if (request.medioPagoOrigenId === request.medioPagoDestinoId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'El medio de pago origen y destino no pueden ser el mismo',
          details: 'Debes seleccionar medios de pago diferentes',
        });
      }

      // Obtener o crear una categoría especial para transferencias (opcional, puedes usar una existente)
      // Por ahora, vamos a requerir que se pase una categoría o usar una por defecto
      // Para simplificar, vamos a buscar una categoría existente o crear una lógica especial
      // Por ahora, vamos a requerir que se pase una categoríaId o usar la primera disponible
      const categorias = await this.categoriaRepository.find({ take: 1 });
      if (categorias.length === 0) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No hay categorías disponibles para crear la transferencia',
        });
      }
      const categoriaTransferencia = categorias[0]; // Usar la primera categoría disponible

      // Validar que hay saldo suficiente en el origen (opcional, pero recomendado)
      // Esto se puede hacer calculando el saldo actual del medio de pago origen
      // Por ahora lo omitimos, pero se puede agregar después

      const fechaActual = new Date();
      const descripcionEgreso = request.descripcion 
        ? `Transferencia a ${medioPagoDestino.nombre}: ${request.descripcion}`
        : `Transferencia a ${medioPagoDestino.nombre}`;
      
      const descripcionIngreso = request.descripcion
        ? `Transferencia desde ${medioPagoOrigen.nombre}: ${request.descripcion}`
        : `Transferencia desde ${medioPagoOrigen.nombre}`;

      // Crear movimiento de egreso (origen)
      const movimientoEgreso = new Movimiento();
      movimientoEgreso.fecha = fechaActual;
      movimientoEgreso.tipoMovimiento = TipoMovimientoEnum.EGRESO;
      movimientoEgreso.descripcion = descripcionEgreso;
      movimientoEgreso.monto = request.monto;
      movimientoEgreso.infoInicial = infoInicial;
      movimientoEgreso.categoria = categoriaTransferencia;
      movimientoEgreso.medioPago = medioPagoOrigen;

      // Crear movimiento de ingreso (destino)
      const movimientoIngreso = new Movimiento();
      movimientoIngreso.fecha = fechaActual;
      movimientoIngreso.tipoMovimiento = TipoMovimientoEnum.INGRESO;
      movimientoIngreso.descripcion = descripcionIngreso;
      movimientoIngreso.monto = request.monto;
      movimientoIngreso.infoInicial = infoInicial;
      movimientoIngreso.categoria = categoriaTransferencia;
      movimientoIngreso.medioPago = medioPagoDestino;

      // Guardar ambos movimientos
      const movimientoEgresoSaved = await this.movimientoRepository.save(movimientoEgreso);
      const movimientoIngresoSaved = await this.movimientoRepository.save(movimientoIngreso);

      // Buscar los movimientos guardados con todas las relaciones
      const movimientoEgresoCompleto = await this.movimientoRepository.findOne({
        where: { id: movimientoEgresoSaved.id },
        relations: ['infoInicial', 'infoInicial.usuario', 'categoria', 'medioPago'],
      });

      const movimientoIngresoCompleto = await this.movimientoRepository.findOne({
        where: { id: movimientoIngresoSaved.id },
        relations: ['infoInicial', 'infoInicial.usuario', 'categoria', 'medioPago'],
      });

      if (!movimientoEgresoCompleto || !movimientoIngresoCompleto) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Error al recuperar los movimientos creados',
        });
      }

      // Convertir a DTOs
      const movimientoEgresoDTO = await this.movimientoMapper.entity2DTO(movimientoEgresoCompleto);
      const movimientoIngresoDTO = await this.movimientoMapper.entity2DTO(movimientoIngresoCompleto);

      return {
        movimientoEgreso: movimientoEgresoDTO,
        movimientoIngreso: movimientoIngresoDTO,
        monto: request.monto,
      };
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
}

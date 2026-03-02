import {
  Injectable,
  HttpException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Presupuesto } from './entities/presupuesto.entity';
import { PresupuestoMapper } from './mappers/presupuesto.mapper';
import { PresupuestoRepository } from './repository/presupuesto.repository';
import { PresupuestoDTO } from './dto/presupuesto.dto';
import { CreatePresupuestoRequestDto } from './dto/create-presupuesto-request.dto';
import { UpdatePresupuestoRequestDto } from './dto/update-presupuesto-request.dto';
import { SearchPresupuestoRequestDto } from './dto/search-presupuesto-request.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { Usuario } from '../usuario/entities/usuario.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';
import { MesEnum } from 'src/common/enums/mes-enum';

export interface PresupuestoEstadoItem {
  categoria: string;
  presupuesto: number;
  gastado: number;
  porcentaje: number;
  estado: 'OK' | 'ALERTA' | 'EXCEDIDO';
}

@Injectable()
export class PresupuestoService {
  constructor(
    private readonly presupuestoMapper: PresupuestoMapper,
    private readonly presupuestoRepository: PresupuestoRepository,
    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<PresupuestoDTO> {
    try {
      const presupuesto =
        await this.presupuestoRepository.findOneByIdAndUsuario(id, usuarioId);
      return await this.presupuestoMapper.entity2DTO(presupuesto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async list(
    request: SearchPresupuestoRequestDto,
    usuarioId: number,
  ): Promise<PresupuestoDTO[]> {
    try {
      if (request.mes == null || request.anio == null) {
        return [];
      }
      const list = await this.presupuestoRepository.findByUsuarioAndMesAnio(
        usuarioId,
        request.mes,
        request.anio,
      );
      return Promise.all(list.map((p) => this.presupuestoMapper.entity2DTO(p)));
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async create(
    request: CreatePresupuestoRequestDto,
    usuarioId: number,
  ): Promise<PresupuestoDTO> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, usuarioId);
      const categoria = await this.getEntityService.findById(
        Categoria,
        request.categoriaId,
      );
      if (categoria.tipo !== TipoCategoriaEnum.EGRESO) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message:
            'El presupuesto solo puede asignarse a categorías de tipo EGRESO',
          details: JSON.stringify({ categoriaId: request.categoriaId }),
        });
      }
      const existe = await this.presupuestoRepository.existsByUsuarioCategoriaMesAnio(
        usuarioId,
        request.categoriaId,
        request.mes,
        request.anio,
      );
      if (existe) {
        throw new BadRequestException({
          code: ERRORS.DATABASE.DUPLICATE_RECORD.CODE,
          message:
            'Ya existe un presupuesto para esta categoría en el mes y año indicados',
          details: JSON.stringify({
            categoriaId: request.categoriaId,
            mes: request.mes,
            anio: request.anio,
          }),
        });
      }
      const entity = (await this.presupuestoMapper.createDTO2Entity(
        request,
      )) as Presupuesto;
      entity.usuario = usuario;
      entity.categoria = categoria;
      const saved = await this.presupuestoRepository.save(entity);
      const withRelations = await this.presupuestoRepository.findOneByIdAndUsuario(
        saved.id,
        usuarioId,
      );
      return await this.presupuestoMapper.entity2DTO(withRelations);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(
    id: number,
    request: UpdatePresupuestoRequestDto,
    usuarioId: number,
  ): Promise<PresupuestoDTO> {
    try {
      const presupuesto =
        await this.presupuestoRepository.findOneByIdAndUsuario(id, usuarioId);
      const updated = await this.presupuestoMapper.updateDTO2Entity(
        presupuesto,
        request,
      );
      await this.presupuestoRepository.save(updated);
      const withRelations = await this.presupuestoRepository.findOneByIdAndUsuario(
        id,
        usuarioId,
      );
      return await this.presupuestoMapper.entity2DTO(withRelations!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number, usuarioId: number): Promise<string> {
    try {
      const presupuesto =
        await this.presupuestoRepository.findOneByIdAndUsuario(id, usuarioId);
      await this.presupuestoRepository.softRemove(presupuesto);
      return 'Presupuesto eliminado correctamente';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  /**
   * Estado de presupuestos para el dashboard (gastado vs presupuesto por categoría).
   */
  async getEstado(
    usuarioId: number,
    mes: MesEnum,
    anio: number,
    sumEgresosByCategoria: (usuarioId: number, mes: number, anio: number) => Promise<Map<number, number>>,
  ): Promise<PresupuestoEstadoItem[]> {
    const presupuestos =
      await this.presupuestoRepository.findByUsuarioAndMesAnio(
        usuarioId,
        mes,
        anio,
      );
    const mesNumero = this.mesToNumber(mes);
    const gastadoPorCategoria = await sumEgresosByCategoria(
      usuarioId,
      mesNumero,
      anio,
    );
    return presupuestos.map((p) => {
      const categoriaId = p.categoria?.id ?? 0;
      const gastado = Number(gastadoPorCategoria.get(categoriaId) ?? 0);
      const monto = Number(p.monto ?? 0);
      const porcentaje = monto > 0 ? (gastado / monto) * 100 : 0;
      let estado: 'OK' | 'ALERTA' | 'EXCEDIDO' = 'OK';
      if (porcentaje > 100) estado = 'EXCEDIDO';
      else if (porcentaje >= 80) estado = 'ALERTA';
      return {
        categoria: p.categoria?.nombre ?? '',
        presupuesto: monto,
        gastado,
        porcentaje: Math.round(porcentaje * 10) / 10,
        estado,
      };
    });
  }

  private mesToNumber(mes: MesEnum): number {
    const map: Record<MesEnum, number> = {
      [MesEnum.ENERO]: 1,
      [MesEnum.FEBRERO]: 2,
      [MesEnum.MARZO]: 3,
      [MesEnum.ABRIL]: 4,
      [MesEnum.MAYO]: 5,
      [MesEnum.JUNIO]: 6,
      [MesEnum.JULIO]: 7,
      [MesEnum.AGOSTO]: 8,
      [MesEnum.SEPTIEMBRE]: 9,
      [MesEnum.OCTUBRE]: 10,
      [MesEnum.NOVIEMBRE]: 11,
      [MesEnum.DICIEMBRE]: 12,
    };
    return map[mes];
  }
}

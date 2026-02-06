import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateGastoFijoRequestDto } from './dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from './dto/update-gasto-fijo-request.dto';
import { SearchGastoFijoRequestDto } from './dto/search-gasto-fijo-request.dto';
import { CreateGastoFijoBulkRequestDto } from './dto/create-gasto-fijo-bulk-request.dto';
import { GastoFijoDTO } from './dto/gasto-fijo.dto';
import { GastoFijoMapper } from './mappers/gasto-fijo.mapper';
import { GastoFijoRepository } from './repository/gasto-fijo.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { CategoriaRepository } from '../categoria/repository/categoria.repository';
import { UsuarioRepository } from '../usuario/repository/usuario.repository';

@Injectable()
export class GastoFijoService {
  constructor(
    private gastoFijoMapper: GastoFijoMapper,
    private gastoFijoRepository: GastoFijoRepository,
    private categoriaRepository: CategoriaRepository,
    private usuarioRepository: UsuarioRepository,
  ) {}

  async findOne(id: number, usuarioId: number): Promise<GastoFijoDTO> {
    const gastoFijo = await this.gastoFijoRepository.findOne({
      where: { id: id },
      relations: ['categoria', 'usuario'],
    });

    if (!gastoFijo) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (gastoFijo.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para ver este gasto fijo',
        details: JSON.stringify({ id }),
      });
    }

    return await this.gastoFijoMapper.entity2DTO(gastoFijo);
  }

  async search(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<PageDto<GastoFijoDTO>> {
    const gastoFijoPage = await this.gastoFijoRepository.search(request, usuarioId);
    return this.gastoFijoMapper.page2Dto(request, gastoFijoPage);
  }

  async create(request: CreateGastoFijoRequestDto, usuarioId: number): Promise<GastoFijoDTO> {
    try {
      // Validar que la categoría existe
      const categoria = await this.categoriaRepository.findOne({
        where: { id: request.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Categoría no encontrada',
          details: JSON.stringify({ categoriaId: request.categoriaId }),
        });
      }

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

      // Crear el gasto fijo
      const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(request, categoria);
      newGastoFijo.usuario = usuario;
      const gastoFijoSaved = await this.gastoFijoRepository.save(newGastoFijo);

      // Buscar el gasto fijo guardado con relaciones
      const searchGastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: gastoFijoSaved.id },
        relations: ['categoria', 'usuario'],
      });

      if (!searchGastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: gastoFijoSaved.id }),
        });
      }

      return this.gastoFijoMapper.entity2DTO(searchGastoFijo);
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
    request: UpdateGastoFijoRequestDto,
    usuarioId: number,
  ): Promise<GastoFijoDTO> {
    try {
      // Verificar que el gasto fijo existe y pertenece al usuario
      const gastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: id },
        relations: ['categoria', 'usuario'],
      });

      if (!gastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      if (gastoFijo.usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: 'No tienes permiso para modificar este gasto fijo',
          details: JSON.stringify({ id }),
        });
      }

      // Validar y cargar categoría si se está actualizando
      let categoria = gastoFijo.categoria;
      if (request.categoriaId !== undefined && request.categoriaId !== gastoFijo.categoria?.id) {
        const nuevaCategoria = await this.categoriaRepository.findOne({
          where: { id: request.categoriaId },
        });

        if (!nuevaCategoria) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Categoría no encontrada',
            details: JSON.stringify({ categoriaId: request.categoriaId }),
          });
        }
        categoria = nuevaCategoria;
      }

      // Actualizar el gasto fijo
      const updateGastoFijo = this.gastoFijoMapper.updateDTO2Entity(gastoFijo, request, categoria);
      await this.gastoFijoRepository.save(updateGastoFijo);

      // Buscar el gasto fijo actualizado
      const searchGastoFijo = await this.gastoFijoRepository.findOne({
        where: { id: id },
        relations: ['categoria', 'usuario'],
      });

      if (!searchGastoFijo) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.gastoFijoMapper.entity2DTO(searchGastoFijo);
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
    const gastoFijo = await this.gastoFijoRepository.findOne({
      where: { id: id },
      relations: ['usuario'],
    });

    if (!gastoFijo) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    if (gastoFijo.usuario.id !== usuarioId) {
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: 'No tienes permiso para eliminar este gasto fijo',
        details: JSON.stringify({ id }),
      });
    }

    await this.gastoFijoRepository.softRemove(gastoFijo);
    return 'Gasto fijo eliminado correctamente';
  }

  async createBulk(request: CreateGastoFijoBulkRequestDto, usuarioId: number): Promise<GastoFijoDTO[]> {
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

      // Obtener todos los IDs de categorías únicos
      const categoriaIds = [...new Set(request.gastosFijos.map(gf => gf.categoriaId))];
      
      // Validar que todas las categorías existen
      const categorias = await this.categoriaRepository.find({
        where: categoriaIds.map(id => ({ id })),
      });

      if (categorias.length !== categoriaIds.length) {
        const categoriasEncontradas = new Set(categorias.map(c => c.id));
        const categoriasNoEncontradas = categoriaIds.filter(id => !categoriasEncontradas.has(id));
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: 'Una o más categorías no fueron encontradas',
          details: JSON.stringify({ categoriaIds: categoriasNoEncontradas }),
        });
      }

      // Crear un mapa de categorías por ID para acceso rápido
      const categoriasMap = new Map(categorias.map(c => [c.id, c]));

      // Crear los gastos fijos
      const nuevosGastosFijos = request.gastosFijos.map(gastoFijoDto => {
        const categoria = categoriasMap.get(gastoFijoDto.categoriaId);
        if (!categoria) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'Categoría no encontrada',
            details: JSON.stringify({ categoriaId: gastoFijoDto.categoriaId }),
          });
        }
        const newGastoFijo = this.gastoFijoMapper.createDTO2Entity(gastoFijoDto, categoria);
        newGastoFijo.usuario = usuario;
        return newGastoFijo;
      });

      // Guardar todos los gastos fijos
      const gastosFijosGuardados = await this.gastoFijoRepository.save(nuevosGastosFijos);

      // Obtener los IDs de los gastos fijos guardados
      const ids = gastosFijosGuardados.map(gf => gf.id);

      // Buscar los gastos fijos guardados con relaciones
      const gastosFijosCompletos = await this.gastoFijoRepository.find({
        where: ids.map(id => ({ id })),
        relations: ['categoria', 'usuario'],
      });

      // Convertir a DTOs
      const dtos = await Promise.all(
        gastosFijosCompletos.map(gf => this.gastoFijoMapper.entity2DTO(gf))
      );

      return dtos;
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
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { GastoFijo } from '../entities/gasto-fijo.entity';
import { SearchGastoFijoRequestDto } from '../dto/search-gasto-fijo-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { ERRORS } from 'src/common/errors/errors-codes';

@Injectable()
export class GastoFijoRepository extends Repository<GastoFijo> {
  constructor(private dataSource: DataSource) {
    super(GastoFijo, dataSource.createEntityManager());
  }

  async search(request: SearchGastoFijoRequestDto, usuarioId: number): Promise<PageDto<GastoFijo>> {
    const queryBuilder: SelectQueryBuilder<GastoFijo> = this.createQueryBuilder(
      'gastoFijo',
    )
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.medioPago', 'medioPago')
      .leftJoinAndSelect('gastoFijo.gastosFijosPagos', 'gastosFijosPagos')
      .leftJoinAndSelect('gastosFijosPagos.infoInicial', 'infoInicial')
      .where('usuario.id = :usuarioId', { usuarioId });

    if (request.id) {
      queryBuilder.andWhere('gastoFijo.id = :id', { id: request.id });
    }

    if (request.nombre) {
      queryBuilder.andWhere('gastoFijo.nombre = :nombre', { nombre: request.nombre });
    }

    if (request.categoriaId) {
      queryBuilder.andWhere('categoria.id = :categoriaId', { categoriaId: request.categoriaId });
    }

    if (request.activo !== undefined) {
      queryBuilder.andWhere('gastoFijo.activo = :activo', { activo: request.activo });
    }

    queryBuilder.orderBy('gastoFijo.nombre', 'ASC');
    queryBuilder.addOrderBy('gastoFijo.id', 'DESC');

    const [list, count] = await queryBuilder
      .skip(request.getOffset())
      .take(request.getTake())
      .getManyAndCount();

    return new PageDto<GastoFijo>(list, count);
  }

  async findOneById(id: number): Promise<GastoFijo> {
    const gastoFijo = await this.findOne({
      where: { id: id },
      relations: ['categoria', 'usuario', 'medioPago'],
    });
    if (!gastoFijo) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }
    return gastoFijo;
  }

  async getGastosFijosActivos(usuarioId: number): Promise<GastoFijo[]> {
    return this.createQueryBuilder('gastoFijo')
      .leftJoinAndSelect('gastoFijo.usuario', 'usuario')
      .leftJoinAndSelect('gastoFijo.categoria', 'categoria')
      .leftJoinAndSelect('gastoFijo.medioPago', 'medioPago')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('gastoFijo.deleted_date IS NULL')
      .andWhere('gastoFijo.activo = :activo', { activo: true })
      .getMany();
  }
}

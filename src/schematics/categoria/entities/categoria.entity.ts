import { BaseEntity } from 'src/common/models/baseentity';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { Movimiento } from 'src/schematics/movimiento/entities/movimiento.entity';
import { Presupuesto } from 'src/schematics/presupuesto/entities/presupuesto.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { TipoCategoriaEnum } from 'src/common/enums/tipo-categoria-enum';

@Entity('cat_01_cab_categoria')
export class Categoria extends BaseEntity {

  @Column({ name: 'cat01_nombre', type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ name: 'cat01_descripcion', type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ name: 'cat01_color', type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ name: 'cat01_icono', type: 'varchar', length: 100, nullable: true })
  icono: string | null;

  @Column({ name: 'cat01_tipo', type: 'enum', enum: TipoCategoriaEnum, nullable: false })
  tipo: TipoCategoriaEnum;

  @Column({ name: 'cat01_activo', type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => Movimiento, (movimiento) => movimiento.categoria)
  movimientos: Movimiento[];

  @OneToMany(() => GastoFijo, (gastosFijos) => gastosFijos.categoria)
  gastosFijos: GastoFijo[];

  @OneToMany(() => Presupuesto, (presupuesto) => presupuesto.categoria)
  presupuestos: Presupuesto[];

  static fromId(id: number) {
    const categoria = new Categoria();
    categoria.id = id;
    return categoria;
  }
}

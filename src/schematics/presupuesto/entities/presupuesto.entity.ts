import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from 'src/common/models/baseentity';
import { MesEnum } from 'src/common/enums/mes-enum';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';

@Entity('pres_01_cab_presupuesto')
@Unique('UQ_presupuesto_usuario_categoria_mes_anio', ['usuario', 'categoria', 'mes', 'anio'])
export class Presupuesto extends BaseEntity {

  @Column({ name: 'pres01_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto: number;

  @Column({ name: 'pres01_mes', type: 'enum', enum: MesEnum, nullable: false })
  mes: MesEnum;

  @Column({ name: 'pres01_anio', type: 'int', nullable: false })
  anio: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'rela01_cat' })
  categoria: Categoria;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'rela01_user' })
  usuario: Usuario;

  static fromId(id: number) {
    const p = new Presupuesto();
    p.id = id;
    return p;
  }
}

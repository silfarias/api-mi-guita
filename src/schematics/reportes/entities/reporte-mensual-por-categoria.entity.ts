import { BaseEntity } from 'src/common/models/baseentity';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

/**
 * Resumen mensual por categoría (solo egresos, por InfoInicial).
 * Se actualiza junto con ReporteMensualResumen al cambiar movimientos del mes.
 */
@Entity('rept_03_rel_resumen_categoria')
@Unique(['infoInicial', 'categoria'])
export class ReporteMensualPorCategoria extends BaseEntity {
  @ManyToOne(() => InfoInicial, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rept03_inf_id' })
  infoInicial: InfoInicial;

  @ManyToOne(() => Categoria, { nullable: false })
  @JoinColumn({ name: 'rept03_cat_id' })
  categoria: Categoria;

  @Column({ name: 'rept03_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'rept03_cantidad_movimientos', type: 'int', default: 0 })
  cantidadMovimientos: number;
}

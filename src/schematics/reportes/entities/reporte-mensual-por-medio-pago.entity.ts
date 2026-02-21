import { BaseEntity } from 'src/common/models/baseentity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { MedioPago } from 'src/schematics/medio-pago/entities/medio-pago.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

/**
 * Resumen mensual por medio de pago (por InfoInicial).
 * Se actualiza junto con ReporteMensualResumen al cambiar movimientos del mes.
 */
@Entity('rept_02_rel_resumen_medio_pago')
@Unique(['infoInicial', 'medioPago'])
export class ReporteMensualPorMedioPago extends BaseEntity {
  @ManyToOne(() => InfoInicial, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rept02_inf_id' })
  infoInicial: InfoInicial;

  @ManyToOne(() => MedioPago, { nullable: false })
  @JoinColumn({ name: 'rept02_med_id' })
  medioPago: MedioPago;

  @Column({ name: 'rept02_total_ingresos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalIngresos: number;

  @Column({ name: 'rept02_total_egresos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEgresos: number;

  @Column({ name: 'rept02_cantidad_movimientos', type: 'int', default: 0 })
  cantidadMovimientos: number;
}

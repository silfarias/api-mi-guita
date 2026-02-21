import { BaseEntity } from 'src/common/models/baseentity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

/**
 * Resumen mensual precalculado por InfoInicial (mes/año/usuario).
 * Se actualiza cuando hay create/update/delete de movimientos del mes.
 * Optimiza el endpoint GET reportes/mensual al leer de aquí en lugar de recalcular.
 */
@Entity('rept_01_cab_resumen_mensual')
export class ReporteMensualResumen extends BaseEntity {
  @OneToOne(() => InfoInicial, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rept01_inf_id' })
  infoInicial: InfoInicial;

  @Column({ name: 'rept01_total_ingresos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalIngresos: number;

  @Column({ name: 'rept01_total_egresos', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEgresos: number;

  @Column({ name: 'rept01_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'rept01_total_movimientos', type: 'int', default: 0 })
  totalMovimientos: number;
}

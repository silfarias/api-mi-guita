import { BaseEntity } from 'src/common/models/baseentity';
import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';
import { Column, Entity, OneToMany } from 'typeorm';
import { InfoInicialMedioPago } from 'src/schematics/info-inicial/entities/info-inicial-mediopago.entity';
import { Movimiento } from 'src/schematics/movimiento/entities/movimiento.entity';

@Entity('med_01_cab_medio_pago')
export class MedioPago extends BaseEntity {

  @Column({ name: 'med01_nombre', type: 'varchar', length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ name: 'med01_tipo', type: 'enum', enum: TipoMedioPagoEnum, nullable: false })
  tipo: TipoMedioPagoEnum;

  @OneToMany(() => InfoInicialMedioPago, (infoInicialMedioPago) => infoInicialMedioPago.medioPago)
  infoInicialMedioPagos: InfoInicialMedioPago[];

  @OneToMany(() => Movimiento, (movimiento) => movimiento.medioPago)
  movimientos: Movimiento[];

  static fromId(id: number) {
    const medioPago = new MedioPago();
    medioPago.id = id;
    return medioPago;
  }
}

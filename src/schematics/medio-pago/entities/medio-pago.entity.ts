import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from 'src/common/models/baseentity';
import { TipoMedioPagoEnum } from 'src/common/enums/tipo-medio-pago-enum';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { PagoGastoFijo } from 'src/schematics/pagos-gasto-fijo/entities/pago-gasto-fijo.entity';
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

  @OneToMany(() => GastoFijo, (gastoFijo) => gastoFijo.medioPago)
  gastosFijos: GastoFijo[];

  @OneToMany(() => PagoGastoFijo, (pagoGastoFijo) => pagoGastoFijo.medioPago)
  pagosGastoFijo: PagoGastoFijo[];

  static fromId(id: number) {
    const medioPago = new MedioPago();
    medioPago.id = id;
    return medioPago;
  }
}

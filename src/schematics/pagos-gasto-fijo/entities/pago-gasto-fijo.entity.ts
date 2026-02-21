import { BaseEntity } from "src/common/models/baseentity";
import { GastoFijo } from "src/schematics/gasto-fijo/entities/gasto-fijo.entity";
import { InfoInicial } from "src/schematics/info-inicial/entities/info-inicial.entity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { MedioPago } from "src/schematics/medio-pago/entities/medio-pago.entity";

@Entity('gast_02_rel_pago_gasto_fijo')
export class PagoGastoFijo extends BaseEntity {

    @ManyToOne(() => GastoFijo, (gastoFijo) => gastoFijo.pagosGastoFijo, { nullable: false })
    @JoinColumn({ name: 'rela01_gast' })
    gastoFijo: GastoFijo;

    @ManyToOne(() => InfoInicial, (infoInicial) => infoInicial.pagosGastoFijo, { nullable: false })
    @JoinColumn({ name: 'rela01_inf' })
    infoInicial: InfoInicial;

    @Column({ name: 'gast02_monto_pago', type: 'decimal', precision: 10, scale: 2, nullable: false })
    montoPago: number;

    @Column({ name: 'gast02_pagado', type: 'boolean', default: false })
    pagado: boolean;

    @ManyToOne(() => MedioPago, (medioPago) => medioPago.pagosGastoFijo)
    @JoinColumn({ name: 'rela01_med' })
    medioPago: MedioPago | null;	

    static fromId(id: number) {
        const pagoGastoFijo = new PagoGastoFijo();
        pagoGastoFijo.id = id;
        return pagoGastoFijo;
    }

}
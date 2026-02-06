import { BaseEntity } from "src/common/models/baseentity";
import { GastoFijo } from "./gasto-fijo.entity";
import { InfoInicial } from "src/schematics/info-inicial/entities/info-inicial.entity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";

@Entity('gast_02_rel_gasto_fijo_pago')
export class GastoFijoPago extends BaseEntity {

    @ManyToOne(() => GastoFijo, (gastoFijo) => gastoFijo.gastosFijosPagos, { nullable: false })
    @JoinColumn({ name: 'rela01_gast' })
    gastoFijo: GastoFijo;

    @ManyToOne(() => InfoInicial, (infoInicial) => infoInicial.gastosFijosPagos, { nullable: false })
    @JoinColumn({ name: 'rela01_inf' })
    infoInicial: InfoInicial;

    @Column({ name: 'gast02_monto_pago', type: 'decimal', precision: 10, scale: 2, nullable: false })
    montoPago: number;

    @Column({ name: 'gast02_pagado', type: 'boolean', default: false })
    pagado: boolean;

    static fromId(id: number) {
        const gastoFijoPago = new GastoFijoPago();
        gastoFijoPago.id = id;
        return gastoFijoPago;
    }

}
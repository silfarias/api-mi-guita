import { BaseEntity } from "src/common/models/baseentity";
import { InfoInicial } from "./info-inicial.entity";
import { MedioPago } from "src/schematics/medio-pago/entities/medio-pago.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('inf_02_rel_info_inicial_mediopago')
export class InfoInicialMedioPago extends BaseEntity {

    @ManyToOne(() => InfoInicial, (infoInicial) => infoInicial.infoInicialMedioPagos)
    @JoinColumn({ name: 'inf01_id' })
    infoInicial: InfoInicial;

    @ManyToOne(() => MedioPago, (medioPago) => medioPago.infoInicialMedioPagos)
    @JoinColumn({ name: 'med01_id' })
    medioPago: MedioPago;

    @Column({ name: 'inf01_med01_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
    monto: number;

    static fromId(id: number) {
        const infoInicialMedioPago = new InfoInicialMedioPago();
        infoInicialMedioPago.id = id;
        return infoInicialMedioPago;
    }
}
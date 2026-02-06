import { BaseEntity } from "src/common/models/baseentity";
import { InfoInicial } from "src/schematics/info-inicial/entities/info-inicial.entity";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";
import { Column, Entity, ManyToOne, JoinColumn, OneToOne } from "typeorm";

@Entity('gast_03_mov_resumen_pago_gasto_fijo')
export class ResumenPagoGastoFijo extends BaseEntity {

    @OneToOne(() => InfoInicial, (infoInicial) => infoInicial.resumenPagoGastoFijo, { nullable: false })
    @JoinColumn({ name: 'rela01_inf' })
    infoInicial: InfoInicial;

    @ManyToOne(() => Usuario, (usuario) => usuario.resumenesPagoGastoFijo, { nullable: false })
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    @Column({ name: 'gas03_monto_total', type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    montoTotal: number;

    @Column({ name: 'gas03_monto_pagado', type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0 })
    montoPagado: number;

    @Column({ name: 'gas03_cantidad_gastos_totales', type: 'int', nullable: false, default: 0 })
    cantidadGastosTotales: number;

    @Column({ name: 'gas03_cantidad_gastos_pagados', type: 'int', nullable: false, default: 0 })
    cantidadGastosPagados: number;

    static fromId(id: number) {
        const resumen = new ResumenPagoGastoFijo();
        resumen.id = id;
        return resumen;
    }
}

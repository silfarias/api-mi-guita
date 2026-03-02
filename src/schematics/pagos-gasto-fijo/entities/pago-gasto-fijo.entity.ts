import { BaseEntity } from "src/common/models/baseentity";
import { GastoFijo } from "src/schematics/gasto-fijo/entities/gasto-fijo.entity";
import { Column, Entity, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { MesEnum } from "src/common/enums/mes-enum";
import { Movimiento } from "src/schematics/movimiento/entities/movimiento.entity";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";

@Entity('gast_02_rel_pago_gasto_fijo')
export class PagoGastoFijo extends BaseEntity {

    @ManyToOne(() => GastoFijo, (gastoFijo) => gastoFijo.pagosGastoFijo, { nullable: false })
    @JoinColumn({ name: 'rela01_gast' })
    gastoFijo: GastoFijo;

    @Column({ name: 'gast02_mes', type: 'enum', enum: MesEnum, nullable: false })
    mes: MesEnum;

    @Column({ name: 'gast02_anio', type: 'int', nullable: false })
    anio: number;

    @Column({ name: 'gast02_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
    monto: number;

    @Column({ name: 'gast02_pagado', type: 'boolean', default: false })
    pagado: boolean;

    @ManyToOne(() => Movimiento, (movimiento) => movimiento.pagosGastoFijo, { nullable: true })
    @JoinColumn({ name: 'rela01_mov' })
    movimimiento: Movimiento | null;
    
    @ManyToOne(() => Usuario, (usuario) => usuario.pagosGastoFijo)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    static fromId(id: number) {
        const pagoGastoFijo = new PagoGastoFijo();
        pagoGastoFijo.id = id;
        return pagoGastoFijo;
    }

}
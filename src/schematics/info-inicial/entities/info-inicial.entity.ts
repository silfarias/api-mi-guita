import { MesEnum } from 'src/common/enums/mes-enum';
import { BaseEntity } from 'src/common/models/baseentity';
import { Movimiento } from 'src/schematics/movimiento/entities/movimiento.entity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { InfoInicialMedioPago } from './info-inicial-mediopago.entity';
import { PagoGastoFijo } from 'src/schematics/pagos-gasto-fijo/entities/pago-gasto-fijo.entity';
import { ResumenPagoGastoFijo } from 'src/schematics/resumen-gasto-fijo/entities/resumen-pago-gasto-fijo.entity';

@Entity('inf_01_cab_info_inicial')
export class InfoInicial extends BaseEntity {

    @ManyToOne(() => Usuario, (usuario) => usuario.infoIniciales, { nullable: false })
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    @Column({ name: 'inf01_anio', type: 'int', nullable: false })
    anio: number;

    @Column({ name: 'inf01_mes', type: 'enum', enum: MesEnum, nullable: false })
    mes: MesEnum;

    @OneToMany(() => Movimiento, (movimiento) => movimiento.infoInicial)
    movimientos: Movimiento[];

    @OneToMany(() => InfoInicialMedioPago, (infoInicialMedioPago) => infoInicialMedioPago.infoInicial)
    infoInicialMedioPagos: InfoInicialMedioPago[];

    @OneToMany(() => PagoGastoFijo, (pagoGastoFijo) => pagoGastoFijo.infoInicial)
    pagosGastoFijo: PagoGastoFijo[];

    @OneToOne(() => ResumenPagoGastoFijo, (resumen) => resumen.infoInicial, { nullable: true })
    resumenPagoGastoFijo?: ResumenPagoGastoFijo;

    static fromId(id: number) {
        const infoInicial = new InfoInicial();
        infoInicial.id = id;
        return infoInicial;
    }
}
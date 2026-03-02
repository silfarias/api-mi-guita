import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "src/common/models/baseentity";
import { MesEnum } from "src/common/enums/mes-enum";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";

@Entity({ name: 'res_01_cab_resumen_mensual' })
export class ResumenMensual extends BaseEntity {

    @Column({ name: 'res01_mes', type: 'enum', enum: MesEnum, nullable: false })
    mes: MesEnum;

    @Column({ name: 'res01_anio', type: 'int', nullable: false })
    anio: number;

    @Column({ name: 'res01_saldo_inicial', type: 'decimal', precision: 10, scale: 2, nullable: false })
    saldoInicial: number;

    @Column({ name: 'res01_saldo_final', type: 'decimal', precision: 10, scale: 2, nullable: false })
    saldoFinal: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.resumenesMensuales)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

}

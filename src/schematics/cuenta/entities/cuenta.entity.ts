import { TipoCuentaEnum } from "src/common/enums/tipo-cuenta-enum";
import { BaseEntity } from "src/common/models/baseentity";
import { Movimiento } from "src/schematics/movimiento/entities/movimiento.entity";
import { Transferencia } from "src/schematics/transferencia/entities/transferencia.entity";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity({ name: 'cta_01_cab_cuenta' })
export class Cuenta extends BaseEntity {

    @Column({ name: 'cta01_nombre', type: 'varchar', length: 100, nullable: false })
    nombre: string;

    @Column({ name: 'cta01_tipo', type: 'enum', enum: TipoCuentaEnum, nullable: false })
    tipo: TipoCuentaEnum;

    @Column({ name: 'cta01_saldo_actual', type: 'decimal', precision: 10, scale: 2, nullable: false })
    saldoActual: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.cuentas)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    @OneToMany(() => Movimiento, (movimiento) => movimiento.cuenta)
    movimientos: Movimiento[];

    @OneToMany(() => Transferencia, (transferencia) => transferencia.cuentaOrigen)
    transferenciasOrigen: Transferencia[];

    @OneToMany(() => Transferencia, (transferencia) => transferencia.cuentaDestino)
    transferenciasDestino: Transferencia[];

    static fromId(id: number) {
        const cuenta = new Cuenta();
        cuenta.id = id;
        return cuenta;
    }
}
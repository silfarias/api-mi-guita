import { BaseEntity } from "src/common/models/baseentity";
import { Cuenta } from "src/schematics/cuenta/entities/cuenta.entity";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";


@Entity({ name: 'tra_01_cab_transferencia' })
export class Transferencia extends BaseEntity {

    @ManyToOne(() => Cuenta, (cuenta) => cuenta.transferenciasOrigen)
    @JoinColumn({ name: 'rela01_cta_origen' })
    cuentaOrigen: Cuenta;

    @ManyToOne(() => Cuenta, (cuenta) => cuenta.transferenciasDestino)
    @JoinColumn({ name: 'rela01_cta_destino' })
    cuentaDestino: Cuenta;

    @Column({ name: 'tra01_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
    monto: number;

    @Column({ name: 'tra01_fecha', type: 'date', nullable: false })
    fecha: Date;

    @ManyToOne(() => Usuario, (usuario) => usuario.transferencias)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    static fromId(id: number) {
        const transferencia = new Transferencia();
        transferencia.id = id;
        return transferencia;
    }
}
import { BaseEntity } from "src/common/models/baseentity";
import { Categoria } from "src/schematics/categoria/entities/categoria.entity";
import { Usuario } from "src/schematics/usuario/entities/usuario.entity";
import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { GastoFijoPago } from "./gasto-fijo-pago.entity";


@Entity('gast_01_cab_gasto_fijo')
export class GastoFijo extends BaseEntity {

    @Column({ name: 'gast01_nombre', type: 'varchar', nullable: false })
    nombre: string;

    @Column({ name: 'gast01_monto_fijo', type: 'decimal', precision: 10, scale: 2, nullable: true })
    montoFijo: number | null;

    @ManyToOne(() => Categoria, (categoria) => categoria.gastosFijos)
    @JoinColumn({ name: 'rela01_cat' })
    categoria: Categoria;

    @ManyToOne(() => Usuario, (usuario) => usuario.gastosFijos)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    @OneToMany(() => GastoFijoPago, (gastoFijoPago) => gastoFijoPago.gastoFijo)
    gastosFijosPagos: GastoFijoPago[];

    static fromId(id: number) {
        const gastoFijo = new GastoFijo();
        gastoFijo.id = id;
        return gastoFijo;
    }

}
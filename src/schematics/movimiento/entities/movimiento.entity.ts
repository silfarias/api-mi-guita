import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { BaseEntity } from 'src/common/models/baseentity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';
import { Cuenta } from 'src/schematics/cuenta/entities/cuenta.entity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { PagoGastoFijo } from 'src/schematics/pagos-gasto-fijo/entities/pago-gasto-fijo.entity';

@Entity('mov_01_cab_movimiento')
export class Movimiento extends BaseEntity {

    @Column({ name: 'mov01_tipo_movimiento', type: 'enum', enum: TipoMovimientoEnum, nullable: false })
    tipoMovimiento: TipoMovimientoEnum;

    @Column({ name: 'mov01_descripcion', type: 'varchar', length: 250, nullable: false })
    descripcion: string;

    @Column({ name: 'mov01_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
    monto: number;

    @Column({ name: 'mov01_fecha', type: 'date', nullable: false })
    fecha: Date;

    @ManyToOne(() => Cuenta, (cuenta) => cuenta.movimientos)
    @JoinColumn({ name: 'rela01_cta' })
    cuenta: Cuenta;

    @ManyToOne(() => Categoria, (categoria) => categoria.movimientos, { nullable: true })
    @JoinColumn({ name: 'rela01_cat' })
    categoria: Categoria | null;

    @ManyToOne(() => Usuario, (usuario) => usuario.movimientos)
    @JoinColumn({ name: 'rela01_user' })
    usuario: Usuario;

    @OneToMany(() => PagoGastoFijo, (pagoGastoFijo) => pagoGastoFijo.movimimiento)
    pagosGastoFijo: PagoGastoFijo[];

    static fromId(id: number) {
        const movimiento = new Movimiento();
        movimiento.id = id;
        return movimiento;
    }
}
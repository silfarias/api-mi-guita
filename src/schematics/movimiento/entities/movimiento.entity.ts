import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { BaseEntity } from 'src/common/models/baseentity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MedioPago } from 'src/schematics/medio-pago/entities/medio-pago.entity';
import { Categoria } from 'src/schematics/categoria/entities/categoria.entity';

@Entity('mov_01_cab_movimiento')
export class Movimiento extends BaseEntity {

    @Column({ name: 'mov01_fecha', type: 'date', nullable: false })
    fecha: Date;

    @Column({ name: 'mov01_tipo_movimiento', type: 'enum', enum: TipoMovimientoEnum, nullable: false })
    tipoMovimiento: TipoMovimientoEnum;

    @ManyToOne(() => Categoria, (categoria) => categoria.movimientos)
    @JoinColumn({ name: 'cat01_id' })
    categoria: Categoria;

    @Column({ name: 'mov01_descripcion', type: 'varchar', length: 250, nullable: false })
    descripcion: string;

    @Column({ name: 'mov01_monto', type: 'decimal', precision: 10, scale: 2, nullable: false })
    monto: number;

    @ManyToOne(() => MedioPago, (medioPago) => medioPago.movimientos)
    @JoinColumn({ name: 'med01_id' })
    medioPago: MedioPago;

    @ManyToOne(() => InfoInicial, (infoInicial) => infoInicial.movimientos, { nullable: false })
    @JoinColumn({ name: 'inf01_id' })
    infoInicial: InfoInicial;

    static fromId(id: number) {
        const movimiento = new Movimiento();
        movimiento.id = id;
        return movimiento;
    }
}
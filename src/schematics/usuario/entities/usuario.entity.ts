import { Column, Entity, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/models/baseentity';
import { Persona } from 'src/schematics/persona/entities/persona.entity';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { Cuenta } from 'src/schematics/cuenta/entities/cuenta.entity';
import { Movimiento } from 'src/schematics/movimiento/entities/movimiento.entity';
import { Transferencia } from 'src/schematics/transferencia/entities/transferencia.entity';
import { PagoGastoFijo } from 'src/schematics/pagos-gasto-fijo/entities/pago-gasto-fijo.entity';
import { ResumenMensual } from 'src/schematics/resumen-mensual/entities/resumen-mensual.entity';

@Entity('user_01_cab_usuario')
export class Usuario extends BaseEntity {

  @Column({ name: 'user01_nombre_usuario', type: 'varchar', length: 100 })
  nombreUsuario: string;

  @Column({ name: 'user01_contrasena', type: 'varchar', length: 255 })
  contrasena: string;

  @Column({ name: 'user01_email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'user01_email_verificado', type: 'boolean', default: false })
  emailVerificado: boolean;

  @Column({ name: 'user01_codigo_verificacion', type: 'varchar', length: 10, nullable: true })
  codigoVerificacionEmail: string | null;

  @Column({ name: 'user01_codigo_verificacion_expira', type: 'datetime', nullable: true })
  codigoVerificacionExpiraEn: Date | null;

  @Column({ name: 'user01_activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'user01_ultimo_acceso', type: 'datetime' })
  ultimoAcceso: Date;

  @Column({ name: 'user01_foto_perfil', type: 'varchar', length: 1000, nullable: true })
  fotoPerfil: string | null;

  @OneToOne(() => Persona, (persona) => persona.usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user02' })
  persona: Persona;

  @OneToMany(() => GastoFijo, (gastosFijos) => gastosFijos.usuario)
  gastosFijos: GastoFijo[];

  @OneToMany(() => Cuenta, (cuenta) => cuenta.usuario)
  cuentas: Cuenta[];

  @OneToMany(() => Movimiento, (movimiento) => movimiento.usuario)
  movimientos: Movimiento[];

  @OneToMany(() => Transferencia, (transferencia) => transferencia.usuario)
  transferencias: Transferencia[];

  @OneToMany(() => PagoGastoFijo, (pagoGastoFijo) => pagoGastoFijo.usuario)
  pagosGastoFijo: PagoGastoFijo[];

  @OneToMany(() => ResumenMensual, (resumenMensual) => resumenMensual.usuario)
  resumenesMensuales: ResumenMensual[];

  static fromId(id: number) {
    const usuario = new Usuario();
    usuario.id = id;
    return usuario;
  }
}
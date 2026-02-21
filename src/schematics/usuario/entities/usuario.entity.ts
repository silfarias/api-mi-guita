import { Column, Entity, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/models/baseentity';
import { Persona } from 'src/schematics/persona/entities/persona.entity';
import { InfoInicial } from 'src/schematics/info-inicial/entities/info-inicial.entity';
import { GastoFijo } from 'src/schematics/gasto-fijo/entities/gasto-fijo.entity';
import { ResumenPagoGastoFijo } from 'src/schematics/resumen-gasto-fijo/entities/resumen-pago-gasto-fijo.entity';

@Entity('user_01_cab_usuario')
export class Usuario extends BaseEntity {

  @Column({ name: 'user01_nombre_usuario', type: 'varchar', length: 100 })
  nombreUsuario: string;

  @Column({ name: 'user01_contrasena', type: 'varchar', length: 255 })
  contrasena: string;

  @Column({ name: 'user01_email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'user01_activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'user01_ultimo_acceso', type: 'datetime' })
  ultimoAcceso: Date;

  @Column({ name: 'user01_foto_perfil', type: 'varchar', length: 1000, nullable: true })
  fotoPerfil: string | null;

  @OneToOne(() => Persona, (persona) => persona.usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user02' })
  persona: Persona;

  @OneToMany(() => InfoInicial, (infoInicial) => infoInicial.usuario)
  infoIniciales: InfoInicial[];

  @OneToMany(() => GastoFijo, (gastosFijos) => gastosFijos.usuario)
  gastosFijos: GastoFijo[];

  @OneToMany(() => ResumenPagoGastoFijo, (resumen) => resumen.usuario)
  resumenesPagoGastoFijo: ResumenPagoGastoFijo[];

  static fromId(id: number) {
    const usuario = new Usuario();
    usuario.id = id;
    return usuario;
  }
}
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Cuenta } from './entities/cuenta.entity';
import { CuentaRepository } from './repository/cuenta.repository';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';

/**
 * Servicio centralizado para toda la lógica de actualización de saldos.
 * Nadie más debe modificar saldoActual de Cuenta directamente.
 * Permite recibir EntityManager opcional para ejecutar dentro de una transacción.
 */
@Injectable()
export class SaldoService {
  constructor(private readonly cuentaRepository: CuentaRepository) {}

  private repo(manager?: EntityManager) {
    return manager ? manager.getRepository(Cuenta) : this.cuentaRepository;
  }

  /**
   * Aplica o revierte un movimiento sobre el saldo de una cuenta.
   * @param cuentaId ID de la cuenta
   * @param tipo INGRESO | EGRESO | SALDO_INICIAL (TRANSFERENCIA no se usa aquí)
   * @param monto Monto positivo
   * @param sumar true = aplicar movimiento, false = revertir
   * @param manager Opcional: para ejecutar en la misma transacción
   */
  async aplicarMovimiento(
    cuentaId: number,
    tipo: TipoMovimientoEnum,
    monto: number,
    sumar: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.repo(manager);
    const cuenta = await repo.findOne({ where: { id: cuentaId } });
    if (!cuenta) return;
    const delta =
      tipo === TipoMovimientoEnum.INGRESO || tipo === TipoMovimientoEnum.SALDO_INICIAL
        ? (sumar ? monto : -monto)
        : tipo === TipoMovimientoEnum.EGRESO
          ? (sumar ? -monto : monto)
          : 0;
    if (delta === 0) return;
    cuenta.saldoActual = Number(cuenta.saldoActual ?? 0) + delta;
    await repo.save(cuenta);
  }

  /**
   * Aplica una transferencia: resta en origen, suma en destino.
   * Validar antes (origen != destino, saldo suficiente si aplica) en el llamador.
   * @param manager Opcional: para ejecutar en la misma transacción
   */
  async aplicarTransferencia(
    cuentaOrigenId: number,
    cuentaDestinoId: number,
    monto: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.repo(manager);
    const [origen, destino] = await Promise.all([
      repo.findOne({ where: { id: cuentaOrigenId } }),
      repo.findOne({ where: { id: cuentaDestinoId } }),
    ]);
    if (!origen || !destino) return;
    origen.saldoActual = Number(origen.saldoActual ?? 0) - monto;
    destino.saldoActual = Number(destino.saldoActual ?? 0) + monto;
    await repo.save([origen, destino]);
  }
}

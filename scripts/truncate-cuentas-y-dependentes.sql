-- ===========================================
-- Truncate Cuentas y tablas que dependen de ellas
-- ===========================================
-- Orden: primero movimientos y transferencias (tienen FK a cuenta),
-- luego cuentas. Así el próximo id de cuenta será 1.

USE miguita;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE mov_01_cab_movimiento;
TRUNCATE TABLE tra_01_cab_transferencia;
TRUNCATE TABLE cta_01_cab_cuenta;

ALTER TABLE mov_01_cab_movimiento AUTO_INCREMENT = 1;
ALTER TABLE tra_01_cab_transferencia AUTO_INCREMENT = 1;
ALTER TABLE cta_01_cab_cuenta AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

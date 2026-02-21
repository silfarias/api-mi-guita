-- Vacía todas las tablas de la base de datos y reinicia los ID (auto_increment en 1).
-- Ejecutar en MySQL (reemplaza 'nonna' por tu DB_NAME si es distinto).
-- Uso: mysql -u root -p nonna < scripts/truncate-all-tables.sql

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE rept_03_rel_resumen_categoria;
TRUNCATE TABLE rept_02_rel_resumen_medio_pago;
TRUNCATE TABLE rept_01_cab_resumen_mensual;
TRUNCATE TABLE gast_03_mov_resumen_pago_gasto_fijo;
TRUNCATE TABLE gast_02_rel_pago_gasto_fijo;
TRUNCATE TABLE gast_01_cab_gasto_fijo;
TRUNCATE TABLE mov_01_cab_movimiento;
TRUNCATE TABLE inf_02_rel_info_inicial_mediopago;
TRUNCATE TABLE inf_01_cab_info_inicial;
TRUNCATE TABLE med_01_cab_medio_pago;
TRUNCATE TABLE cat_01_cab_categoria;
TRUNCATE TABLE user_02_cab_persona;
TRUNCATE TABLE user_01_cab_usuario;

SET FOREIGN_KEY_CHECKS = 1;

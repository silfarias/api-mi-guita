-- ===========================================
-- Script para precargar la tabla de Medios de Pago
-- ===========================================
-- Este script inserta las billeteras virtuales y bancos con los datos exactos especificados
-- Ejecutar después de crear la tabla med_01_cab_medio_pago
-- IMPORTANTE: Asegúrate de que el enum TipoMedioPagoEnum esté creado en la base de datos

USE miguita;

-- Eliminar registros existentes si es necesario (opcional, comentar si quieres mantener datos existentes)
-- DELETE FROM med_01_cab_medio_pago;

-- ===========================================
-- INSERTAR MEDIOS DE PAGO CON IDs ESPECÍFICOS
-- ===========================================

-- Desactivar temporalmente las verificaciones de foreign key si es necesario
SET FOREIGN_KEY_CHECKS = 0;

-- Insertar o reemplazar medios de pago
INSERT INTO med_01_cab_medio_pago (id, med01_nombre, med01_tipo, created_date, updated_date, deleted_date) VALUES
(1, 'Efectivo', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(2, 'Mercado Pago', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(3, 'Naranja X', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(4, 'Ualá', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(5, 'Brubank', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(6, 'Reba', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(7, 'Lemon Cash', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(8, 'Buenbit', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(9, 'Prex', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(10, 'Modo', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(11, 'Plus Cambios', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(12, 'Tenpo', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(13, 'Cuenta DNI', 'BILLETERA_VIRTUAL', NOW(), NOW(), NULL),
(14, 'Banco Nación', 'BANCO', NOW(), NOW(), NULL),
(15, 'Banco Provincia', 'BANCO', NOW(), NOW(), NULL),
(16, 'Banco Galicia', 'BANCO', NOW(), NOW(), NULL),
(17, 'Banco Santander', 'BANCO', NOW(), NOW(), NULL),
(18, 'Banco BBVA', 'BANCO', NOW(), NOW(), NULL),
(19, 'Banco ICBC', 'BANCO', NOW(), NOW(), NULL),
(20, 'Banco Macro', 'BANCO', NOW(), NOW(), NULL),
(21, 'Banco Supervielle', 'BANCO', NOW(), NOW(), NULL),
(22, 'Banco Comafi', 'BANCO', NOW(), NOW(), NULL),
(23, 'Banco Credicoop', 'BANCO', NOW(), NOW(), NULL),
(24, 'Banco Patagonia', 'BANCO', NOW(), NOW(), NULL),
(25, 'Banco Hipotecario', 'BANCO', NOW(), NOW(), NULL),
(26, 'Banco Ciudad', 'BANCO', NOW(), NOW(), NULL),
(27, 'Banco Itaú', 'BANCO', NOW(), NOW(), NULL),
(28, 'Banco HSBC', 'BANCO', NOW(), NOW(), NULL),
(29, 'Banco Formosa', 'BANCO', NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
    med01_nombre = VALUES(med01_nombre),
    med01_tipo = VALUES(med01_tipo),
    updated_date = VALUES(updated_date);

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar los datos insertados
SELECT id, med01_nombre, med01_tipo, created_date, updated_date 
FROM med_01_cab_medio_pago 
ORDER BY med01_tipo, med01_nombre;

-- ===========================================
-- Script para precargar la tabla de Medios de Pago
-- ===========================================
-- Este script inserta las billeteras virtuales y bancos más comunes
-- Ejecutar después de crear la tabla med_01_cab_medio_pago
-- IMPORTANTE: Asegúrate de que el enum TipoMedioPagoEnum esté creado en la base de datos

-- Billeteras Virtuales y Fintech
INSERT INTO med_01_cab_medio_pago (med01_nombre, med01_tipo, created_date, updated_date) VALUES
('Efectivo', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Mercado Pago', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Naranja X', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Ualá', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Brubank', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Reba', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Lemon Cash', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Buenbit', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Prex', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Modo', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Plus Cambios', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Tenpo', 'BILLETERA_VIRTUAL', NOW(), NOW()),
('Cuenta DNI', 'BILLETERA_VIRTUAL', NOW(), NOW());

-- Bancos Tradicionales
INSERT INTO med_01_cab_medio_pago (med01_nombre, med01_tipo, created_date, updated_date) VALUES
('Banco Nación', 'BANCO', NOW(), NOW()),
('Banco Provincia', 'BANCO', NOW(), NOW()),
('Banco Galicia', 'BANCO', NOW(), NOW()),
('Banco Santander', 'BANCO', NOW(), NOW()),
('Banco BBVA', 'BANCO', NOW(), NOW()),
('Banco ICBC', 'BANCO', NOW(), NOW()),
('Banco Macro', 'BANCO', NOW(), NOW()),
('Banco Supervielle', 'BANCO', NOW(), NOW()),
('Banco Comafi', 'BANCO', NOW(), NOW()),
('Banco Credicoop', 'BANCO', NOW(), NOW()),
('Banco Patagonia', 'BANCO', NOW(), NOW()),
('Banco Hipotecario', 'BANCO', NOW(), NOW()),
('Banco Ciudad', 'BANCO', NOW(), NOW()),
('Banco Itaú', 'BANCO', NOW(), NOW()),
('Banco HSBC', 'BANCO', NOW(), NOW());

-- Verificar los datos insertados
SELECT * FROM med_01_cab_medio_pago ORDER BY med01_tipo, med01_nombre;

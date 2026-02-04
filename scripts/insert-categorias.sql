-- ===========================================
-- Script para precargar la tabla de Categorías
-- ===========================================
-- Este script inserta las categorías más comunes para clasificar gastos
-- Ejecutar después de crear la tabla cat_01_cab_categoria

-- ===========================================
-- ALIMENTACIÓN
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Alimentación', 'Comida, bebidas, supermercado y restaurantes', '#FF6B6B', 'restaurant', true, NOW(), NOW());

-- ===========================================
-- TRANSPORTE
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Transporte', 'Gastos de transporte (combustible, pasajes, taxi, etc.)', '#95E1D3', 'directions-transit', true, NOW(), NOW());

-- ===========================================
-- SERVICIOS DEL HOGAR
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Luz', 'Factura de electricidad', '#FFD93D', 'lightbulb', true, NOW(), NOW()),
('Agua', 'Factura de agua', '#6BCB77', 'water-drop', true, NOW(), NOW()),
('Gas', 'Factura de gas', '#FF6B6B', 'whatshot', true, NOW(), NOW()),
('Internet', 'Servicio de internet', '#4D96FF', 'wifi', true, NOW(), NOW()),
('Cable/TV', 'Cable, streaming, servicios de TV', '#9B59B6', 'tv', true, NOW(), NOW()),
('Teléfono', 'Factura de teléfono fijo y celular', '#3498DB', 'phone', true, NOW(), NOW()),
('Alquiler', 'Alquiler de vivienda', '#E74C3C', 'home', true, NOW(), NOW()),
('Expensas', 'Expensas del consorcio', '#F39C12', 'apartment', true, NOW(), NOW());

-- ===========================================
-- IMPUESTOS Y SERVICIOS
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Impuestos', 'Impuestos varios (ABL, patente, etc.)', '#E74C3C', 'receipt', true, NOW(), NOW()),
('Seguro', 'Seguros (auto, hogar, vida, etc.)', '#3498DB', 'security', true, NOW(), NOW());

-- ===========================================
-- SALUD Y BIENESTAR
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Salud', 'Gastos médicos, consultas, medicamentos y farmacia', '#E74C3C', 'local-hospital', true, NOW(), NOW()),
('Gimnasio', 'Gimnasio, clases de ejercicio', '#4ECDC4', 'fitness-center', true, NOW(), NOW()),
('Cuidado Personal', 'Productos de higiene y cuidado personal', '#FFB6C1', 'spa', true, NOW(), NOW());

-- ===========================================
-- EDUCACIÓN Y CULTURA
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Educación', 'Cursos, libros, materiales de estudio', '#3498DB', 'school', true, NOW(), NOW()),
('Entretenimiento', 'Cine, teatro, eventos', '#E91E63', 'movie', true, NOW(), NOW());

-- ===========================================
-- ROPA Y ACCESORIOS
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Ropa y Accesorios', 'Ropa, calzado y accesorios', '#FF6B9D', 'checkroom', true, NOW(), NOW());

-- ===========================================
-- HOGAR Y MANTENIMIENTO
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Hogar', 'Artículos para el hogar, limpieza, muebles y decoración', '#FFA07A', 'home', true, NOW(), NOW()),
('Mantenimiento', 'Reparaciones y mantenimiento del hogar', '#DDA0DD', 'build', true, NOW(), NOW());

-- ===========================================
-- TECNOLOGÍA
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Tecnología', 'Dispositivos electrónicos, software y suscripciones digitales', '#4A90E2', 'devices', true, NOW(), NOW());

-- ===========================================
-- MASCOTAS
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Mascotas', 'Alimento, veterinaria y cuidados de mascotas', '#FFB347', 'pets', true, NOW(), NOW());

-- ===========================================
-- REGALOS Y DONACIONES
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Regalos y Donaciones', 'Regalos para cumpleaños, eventos y donaciones', '#FF69B4', 'card-giftcard', true, NOW(), NOW());

-- ===========================================
-- OTROS
-- ===========================================
INSERT INTO cat_01_cab_categoria (cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date) VALUES
('Deudas', 'Pagos de préstamos, créditos y tarjeta de crédito', '#34495E', 'account-balance', true, NOW(), NOW()),
('Otros', 'Gastos varios que no encajan en otras categorías', '#95A5A6', 'more-horiz', true, NOW(), NOW());

-- Verificar los datos insertados
SELECT * FROM cat_01_cab_categoria ORDER BY cat01_nombre;

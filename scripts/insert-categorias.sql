-- ===========================================
-- Script para precargar la tabla de Categorías
-- ===========================================
-- Este script inserta las categorías con los datos exactos especificados
-- Ejecutar después de crear la tabla cat_01_cab_categoria

USE miguita;

-- Eliminar registros existentes si es necesario (opcional, comentar si quieres mantener datos existentes)
-- DELETE FROM cat_01_cab_categoria;

-- ===========================================
-- INSERTAR CATEGORÍAS CON IDs ESPECÍFICOS
-- ===========================================

-- Desactivar temporalmente las verificaciones de foreign key si es necesario
SET FOREIGN_KEY_CHECKS = 0;

-- Insertar o reemplazar categorías
INSERT INTO cat_01_cab_categoria (id, cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date, deleted_date) VALUES
(1, 'Alimentación', 'Comida, bebidas, supermercado y restaurantes', '#FF6B6B', 'silverware-fork-knife', 1, NOW(), NOW(), NULL),
(2, 'Transporte', 'Gastos de transporte (combustible, pasajes, taxi, etc.)', '#95E1D3', 'car-side', 1, NOW(), NOW(), NULL),
(3, 'Luz', 'Factura de electricidad', '#FFD93D', 'lightbulb', 1, NOW(), NOW(), NULL),
(4, 'Agua', 'Factura de agua', '#6CB4EE', 'water', 1, NOW(), NOW(), NULL),
(5, 'Gas', 'Factura de gas', '#FF6B6B', 'gas-cylinder', 1, NOW(), NOW(), NULL),
(6, 'Internet', 'Servicio de internet', '#4D96FF', 'wifi', 1, NOW(), NOW(), NULL),
(7, 'Cable/TV', 'Cable, streaming, servicios de TV', '#9B59B6', 'television', 1, NOW(), NOW(), NULL),
(8, 'Teléfono', 'Factura de teléfono fijo y celular', '#3498DB', 'phone', 1, NOW(), NOW(), NULL),
(9, 'Alquiler', 'Alquiler de vivienda', '#E74C3C', 'home', 1, NOW(), NOW(), NULL),
(10, 'Expensas', 'Expensas del consorcio', '#F39C12', 'home-city', 1, NOW(), NOW(), NULL),
(11, 'Impuestos', 'Impuestos varios (ABL, patente, etc.)', '#E74C3C', 'receipt', 1, NOW(), NOW(), NULL),
(12, 'Seguro', 'Seguros (auto, hogar, vida, etc.)', '#3498DB', 'security', 1, NOW(), NOW(), NULL),
(13, 'Salud', 'Gastos médicos, consultas, medicamentos y farmacia', '#E74C3C', 'medical-bag', 1, NOW(), NOW(), NULL),
(14, 'Gimnasio', 'Gimnasio, clases de ejercicio', '#4ECDC4', 'dumbbell', 1, NOW(), NOW(), NULL),
(15, 'Cuidado Personal', 'Productos de higiene y cuidado personal', '#FFB6C1', 'spa', 1, NOW(), NOW(), NULL),
(16, 'Educación', 'Cursos, libros, materiales de estudio', '#3498DB', 'school', 1, NOW(), NOW(), NULL),
(17, 'Entretenimiento', 'Cine, teatro, eventos', '#E91E63', 'movie', 1, NOW(), NOW(), NULL),
(18, 'Ropa y Accesorios', 'Ropa, calzado y accesorios', '#FF6B9D', 'tshirt-crew', 1, NOW(), NOW(), NULL),
(19, 'Hogar', 'Artículos para el hogar, limpieza, muebles y decoración', '#FFA07A', 'home', 1, NOW(), NOW(), NULL),
(20, 'Mantenimiento', 'Reparaciones y mantenimiento del hogar', '#DDA0DD', 'tools', 1, NOW(), NOW(), NULL),
(21, 'Tecnología', 'Dispositivos electrónicos, software y suscripciones digitales', '#4A90E2', 'devices', 1, NOW(), NOW(), NULL),
(22, 'Mascotas', 'Alimento, veterinaria y cuidados de mascotas', '#FFB347', 'paw', 1, NOW(), NOW(), NULL),
(23, 'Regalos y Donaciones', 'Regalos para cumpleaños, eventos y donaciones', '#FF69B4', 'hand-heart', 1, NOW(), NOW(), NULL),
(24, 'Deudas', 'Pagos de préstamos, créditos y tarjeta de crédito', '#34495E', 'file-document-edit', 1, NOW(), NOW(), NULL),
(25, 'Otros', 'Gastos varios que no encajan en otras categorías', '#95A5A6', 'plus-circle', 1, NOW(), NOW(), NULL),
(26, 'Supermercado', 'Gastos relacionados a las compras del supermercado', '#C771F5', 'cart', 1, NOW(), NOW(), NULL),
(27, 'Sueldo', 'Ingreso por sueldo o salario', '#27AE60', 'wallet', 1, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
    cat01_nombre = VALUES(cat01_nombre),
    cat01_descripcion = VALUES(cat01_descripcion),
    cat01_color = VALUES(cat01_color),
    cat01_icono = VALUES(cat01_icono),
    cat01_activo = VALUES(cat01_activo),
    updated_date = VALUES(updated_date);

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar los datos insertados
SELECT id, cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_activo, created_date, updated_date 
FROM cat_01_cab_categoria 
ORDER BY id;

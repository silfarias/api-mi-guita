-- ===========================================
-- Script para precargar la tabla de Categorías
-- ===========================================
-- Categorías consolidadas con tipo INGRESO/EGRESO.
-- Ejecutar después de tener la tabla cat_01_cab_categoria con la columna cat01_tipo.

USE miguita;

-- Opcional: vaciar categorías antes de reinsertar (descomentar si querés partir de cero)
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM cat_01_cab_categoria;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- INSERTAR CATEGORÍAS (con tipo INGRESO / EGRESO)
-- ===========================================

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO cat_01_cab_categoria (id, cat01_nombre, cat01_descripcion, cat01_color, cat01_icono, cat01_tipo, cat01_activo, created_date, updated_date, deleted_date) VALUES
-- EGRESOS
(1, 'Comidas y bebidas', 'Supermercado, restaurantes, delivery, bebidas y alimentos', '#FF6B6B', 'silverware-fork-knife', 'EGRESO', 1, NOW(), NOW(), NULL),
(2, 'Transporte', 'Combustible, pasajes, taxi, Uber, mantenimiento del auto', '#95E1D3', 'car-side', 'EGRESO', 1, NOW(), NOW(), NULL),
(3, 'Servicios', 'Luz, agua, gas, internet, cable, TV, teléfono y WiFi', '#FFD93D', 'lightbulb', 'EGRESO', 1, NOW(), NOW(), NULL),
(4, 'Suscripciones', 'Netflix, streaming, Spotify, apps y servicios mensuales', '#9B59B6', 'television', 'EGRESO', 1, NOW(), NOW(), NULL),
(5, 'Alquiler', 'Alquiler de vivienda', '#E74C3C', 'home', 'EGRESO', 1, NOW(), NOW(), NULL),
(6, 'Expensas', 'Expensas del consorcio', '#F39C12', 'home-city', 'EGRESO', 1, NOW(), NOW(), NULL),
(7, 'Impuestos', 'ABL, patente, impuestos varios', '#E74C3C', 'receipt', 'EGRESO', 1, NOW(), NOW(), NULL),
(8, 'Seguro', 'Seguros de auto, hogar, vida, etc.', '#3498DB', 'shield-check', 'EGRESO', 1, NOW(), NOW(), NULL),
(9, 'Salud', 'Médico, consultas, medicamentos y farmacia', '#E74C3C', 'medical-bag', 'EGRESO', 1, NOW(), NOW(), NULL),
(10, 'Deportes', 'Gimnasio, canchas, pilates, yoga y actividad física', '#4ECDC4', 'dumbbell', 'EGRESO', 1, NOW(), NOW(), NULL),
(11, 'Cuidado personal', 'Higiene, cosméticos y cuidado personal', '#FFB6C1', 'spa', 'EGRESO', 1, NOW(), NOW(), NULL),
(12, 'Educación', 'Cursos, libros, materiales de estudio', '#3498DB', 'school', 'EGRESO', 1, NOW(), NOW(), NULL),
(13, 'Entretenimiento', 'Cine, teatro, eventos y salidas', '#E91E63', 'movie', 'EGRESO', 1, NOW(), NOW(), NULL),
(14, 'Ropa y accesorios', 'Ropa, calzado y accesorios', '#FF6B9D', 'tshirt-crew', 'EGRESO', 1, NOW(), NOW(), NULL),
(15, 'Hogar', 'Limpieza, muebles, decoración y artículos para el hogar', '#FFA07A', 'sofa', 'EGRESO', 1, NOW(), NOW(), NULL),
(16, 'Mantenimiento y reparación', 'Reparaciones del hogar, plomería, electricidad, etc.', '#DDA0DD', 'tools', 'EGRESO', 1, NOW(), NOW(), NULL),
(17, 'Tecnología', 'Dispositivos electrónicos, software y accesorios', '#4A90E2', 'devices', 'EGRESO', 1, NOW(), NOW(), NULL),
(18, 'Mascotas', 'Alimento, veterinaria y cuidados de mascotas', '#FFB347', 'paw', 'EGRESO', 1, NOW(), NOW(), NULL),
(19, 'Regalos y donaciones', 'Regalos, cumpleaños y donaciones', '#FF69B4', 'hand-heart', 'EGRESO', 1, NOW(), NOW(), NULL),
(20, 'Deudas', 'Préstamos, créditos y pagos de tarjeta', '#34495E', 'file-document-edit', 'EGRESO', 1, NOW(), NOW(), NULL),
(21, 'Viajes', 'Pasajes, alojamiento, vacaciones y turismo', '#1ABC9C', 'airplane', 'EGRESO', 1, NOW(), NOW(), NULL),
(22, 'Otros gastos', 'Gastos varios que no encajan en otras categorías', '#95A5A6', 'plus-circle', 'EGRESO', 1, NOW(), NOW(), NULL),
-- INGRESOS
(23, 'Sueldo', 'Ingreso por salario o sueldo', '#27AE60', 'wallet', 'INGRESO', 1, NOW(), NOW(), NULL),
(24, 'Inversiones', 'Rendimientos de inversiones, dividendos, intereses', '#2ECC71', 'chart-line', 'INGRESO', 1, NOW(), NOW(), NULL),
(25, 'Ingreso extra', 'Freelance, ventas, bonos, propinas y otros ingresos ocasionales', '#16A085', 'cash-plus', 'INGRESO', 1, NOW(), NOW(), NULL),
(26, 'Otros ingresos', 'Ingresos que no encajan en otras categorías', '#27AE60', 'wallet-plus', 'INGRESO', 1, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
    cat01_nombre = VALUES(cat01_nombre),
    cat01_descripcion = VALUES(cat01_descripcion),
    cat01_color = VALUES(cat01_color),
    cat01_icono = VALUES(cat01_icono),
    cat01_tipo = VALUES(cat01_tipo),
    cat01_activo = VALUES(cat01_activo),
    updated_date = VALUES(updated_date);

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar los datos insertados
SELECT id, cat01_nombre, cat01_tipo, cat01_descripcion, cat01_activo
FROM cat_01_cab_categoria
ORDER BY cat01_tipo, id;

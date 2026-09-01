-- USE finanzas_personales; -- Comentado para Clever Cloud: usa la DB de la conexión (bhoaaacrey4xvrzjdpdc). Para local, descomenta o ejecuta con: mysql -D finanzas_personales < seed.sql

-- Limpieza para re-ejecutable (orden por FK)
DELETE FROM ingresos_gastos;
DELETE FROM categorias;
DELETE FROM usuarios;
ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE categorias AUTO_INCREMENT = 1;
ALTER TABLE ingresos_gastos AUTO_INCREMENT = 1;

-- Usuario demo (password: 12345678 -> hash bcrypt se genera en backend, aquí placeholder compatible)
-- Hash bcrypt para "12345678" generado con bcrypt (12 rounds). Si usas otro password, re-hashea en backend.
INSERT INTO usuarios (nombre, correo, contrasena_hash, fecha_registro) VALUES
('Ana Torres', 'ana@example.com', '$2b$12$vt3UM0jK.kovGdtCQ3o.fO02iV2tufmr.I1ylha0suwiLzfZXW/8e', '2026-01-15 10:00:00'),
('Miguel Leon', 'miguel@example.com', '$2b$12$vt3UM0jK.kovGdtCQ3o.fO02iV2tufmr.I1ylha0suwiLzfZXW/8e', '2026-02-01 09:00:00');

-- Categorías para Ana (id_usuario=1)
INSERT INTO categorias (nombre, tipo, id_usuario) VALUES
('Salario', 'ingreso', 1),
('Freelance', 'ingreso', 1),
('Alimentación', 'gasto', 1),
('Transporte', 'gasto', 1),
('Entretenimiento', 'gasto', 1),
('Salud', 'gasto', 1);

-- Categorías para Miguel (id_usuario=2)
INSERT INTO categorias (nombre, tipo, id_usuario) VALUES
('Salario', 'ingreso', 2),
('Freelance', 'ingreso', 2),
('Alimentación', 'gasto', 2),
('Transporte', 'gasto', 2),
('Entretenimiento', 'gasto', 2),
('Salud', 'gasto', 2);

-- Movimientos Ana: 6 meses (feb - jul 2026) con tendencia creciente y 2 anomalías
-- Feb 2026
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2500000, '2026-02-01', 'Pago mensual Feb'),
(1, 3, 'gasto', 280000, '2026-02-05', 'Mercado Feb'),
(1, 4, 'gasto', 85000,  '2026-02-07', 'Transporte Feb'),
(1, 5, 'gasto', 120000, '2026-02-10', 'Cine Feb');

-- Mar 2026
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2500000, '2026-03-01', 'Pago mensual Mar'),
(1, 2, 'ingreso', 400000,  '2026-03-15', 'Freelance Mar'),
(1, 3, 'gasto', 310000, '2026-03-05', 'Mercado Mar'),
(1, 4, 'gasto', 95000,  '2026-03-08', 'Transporte Mar'),
(1, 5, 'gasto', 180000, '2026-03-12', 'Concierto Mar'),
(1, 6, 'gasto', 70000,  '2026-03-20', 'Farmacia Mar');

-- Abr 2026
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2500000, '2026-04-01', 'Pago mensual Abr'),
(1, 3, 'gasto', 340000, '2026-04-06', 'Mercado Abr'),
(1, 4, 'gasto', 110000, '2026-04-09', 'Transporte Abr'),
(1, 5, 'gasto', 200000, '2026-04-14', 'Salidas Abr'),
(1, 6, 'gasto', 95000,  '2026-04-18', 'Consulta Abr');

-- May 2026
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2600000, '2026-05-01', 'Pago mensual May (+aumento)'),
(1, 2, 'ingreso', 550000,  '2026-05-16', 'Proyecto freelance May'),
(1, 3, 'gasto', 360000, '2026-05-05', 'Mercado May'),
(1, 4, 'gasto', 105000, '2026-05-08', 'Transporte May'),
(1, 5, 'gasto', 250000, '2026-05-11', 'Viaje corto May'),
(1, 6, 'gasto', 120000, '2026-05-22', 'Odontología May');

-- Jun 2026 (datos del spec)
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2500000, '2026-06-01', 'Pago mensual'),
(1, 3, 'gasto', 320000, '2026-06-05', 'Mercado del mes'),
(1, 4, 'gasto', 90000,  '2026-06-07', 'Transporte semanal'),
(1, 5, 'gasto', 150000, '2026-06-10', 'Cine y salidas');

-- Jul 2026 (incluye anomalía Salud 800k)
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 1, 'ingreso', 2500000, '2026-07-01', 'Pago mensual'),
(1, 3, 'gasto', 300000, '2026-07-04', 'Mercado del mes'),
(1, 4, 'gasto', 95000,  '2026-07-08', 'Transporte Jul'),
(1, 6, 'gasto', 800000, '2026-07-15', 'Consulta médica de urgencia'),
(1, 5, 'gasto', 170000, '2026-07-20', 'Entretenimiento Jul');

-- Datos adicionales para probar anomalías: gasto pequeño y luego uno muy grande en misma categoría
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(1, 3, 'gasto', 290000, '2026-05-15', 'Mercado extra May'),
(1, 4, 'gasto', 88000,  '2026-04-25', 'Transporte extra Abr');

-- Miguel: datos mínimos para probar usuario nuevo con pocos datos
INSERT INTO ingresos_gastos (id_usuario, id_categoria, tipo, monto, fecha, descripcion) VALUES
(2, 7, 'ingreso', 2000000, '2026-07-01', 'Salario Miguel'),
(2, 9, 'gasto', 250000, '2026-07-05', 'Mercado Miguel'),
(2, 10, 'gasto', 80000, '2026-07-07', 'Transporte Miguel');

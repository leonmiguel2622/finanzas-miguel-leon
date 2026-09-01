-- Finanzas Personales - Schema MySQL 8.0+
-- 3FN,utf8mb4, validaciones y índices para módulo analítico
-- Para Clever Cloud (bhoaaacrey4xvrzjdpdc): NO ejecuta CREATE DATABASE (sin permisos), la DB ya existe. Las tablas se crean en la DB de la conexión.
-- Para local: descomenta las 2 líneas siguientes si necesitas crear la DB local:
-- CREATE DATABASE IF NOT EXISTS finanzas_personales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE finanzas_personales;

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_registro  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nombre_usuario CHECK (nombre <> ''),
    CONSTRAINT chk_correo_usuario CHECK (correo REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_contrasena_hash CHECK (CHAR_LENGTH(contrasena_hash) >= 20)
) ENGINE=InnoDB;

-- Categorías por usuario (ingreso / gasto)
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria    INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL,
    tipo            ENUM('ingreso', 'gasto') NOT NULL,
    id_usuario      INT NOT NULL,
    CONSTRAINT chk_nombre_categoria CHECK (nombre <> ''),
    CONSTRAINT fk_categoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT uq_categoria_usuario UNIQUE (id_usuario, nombre)
) ENGINE=InnoDB;

CREATE INDEX idx_categoria_usuario ON categorias (id_usuario);

-- Movimientos
CREATE TABLE IF NOT EXISTS ingresos_gastos (
    id_movimiento   INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario      INT NOT NULL,
    id_categoria    INT NOT NULL,
    tipo            ENUM('ingreso', 'gasto') NOT NULL,
    monto           DECIMAL(12,2) NOT NULL,
    fecha           DATE NOT NULL,
    descripcion     VARCHAR(255),
    fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_monto_positivo CHECK (monto > 0),
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Índices para consultas analíticas
CREATE INDEX idx_mov_usuario_fecha ON ingresos_gastos (id_usuario, fecha);
CREATE INDEX idx_mov_categoria ON ingresos_gastos (id_categoria);
CREATE INDEX idx_mov_usuario_categoria ON ingresos_gastos (id_usuario, id_categoria);

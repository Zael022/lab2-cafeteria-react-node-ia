-- =====================================================================
-- Laboratorio #2 · Caso 1: Punto de venta e inventario de una cafetería
-- Esquema relacional + datos de ejemplo (SQLite)
--
-- Cargar (cualquiera de las tres):
--   cd backend && npm run db:reset
--   VS Code (extensión SQLite de alexcvzz): abrir este archivo,
--     clic derecho → "Run Query" y elegir backend/cafeteria.db
--   sqlite3 backend/cafeteria.db < schema.sql
--
-- El script borra y vuelve a crear todo, así que se puede correr
-- cuantas veces haga falta para volver a los datos de ejemplo.
--
-- Notas de SQLite:
--  · No hay BOOLEAN: se usa INTEGER 0/1 con un CHECK.
--  · No hay tipo fecha: se guarda TEXTO en formato ISO 8601 en UTC
--    (2026-10-21T16:30:00.000Z), que se puede ordenar y comparar.
--  · INTEGER PRIMARY KEY se autoincrementa solo (como SERIAL).
--  · Las llaves foráneas hay que encenderlas en cada conexión.
-- =====================================================================

PRAGMA foreign_keys = OFF;   -- para poder borrar las tablas en cualquier orden

DROP TABLE IF EXISTS pedido_items;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS recetas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS insumos;

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- insumos: la materia prima (café, leche, vasos...).
-- El stock nunca puede quedar negativo: es la última barrera por si
-- alguna regla del servidor fallara.
-- ---------------------------------------------------------------------
CREATE TABLE insumos (
  id           INTEGER PRIMARY KEY,
  nombre       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  unidad       TEXT    NOT NULL CHECK (unidad IN ('g', 'ml', 'unidad')),
  stock        REAL    NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo REAL    NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0)
);

-- ---------------------------------------------------------------------
-- productos: lo que se vende en el mostrador.
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id        INTEGER PRIMARY KEY,
  nombre    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  precio    REAL    NOT NULL CHECK (precio > 0),
  categoria TEXT    NOT NULL CHECK (categoria IN
              ('bebidas calientes', 'bebidas frías', 'panadería', 'snacks')),
  activo    INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- ---------------------------------------------------------------------
-- recetas: tabla intermedia producto <-> insumo.
-- "Un capuchino usa 18 g de café, 150 ml de leche y 1 vaso" = 3 filas.
-- Si se borra un producto, su receta se borra con él (CASCADE).
-- Un insumo que está en alguna receta NO se puede borrar (RESTRICT).
-- ---------------------------------------------------------------------
CREATE TABLE recetas (
  id          INTEGER PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  insumo_id   INTEGER NOT NULL REFERENCES insumos(id)   ON DELETE RESTRICT,
  cantidad    REAL    NOT NULL CHECK (cantidad > 0),
  UNIQUE (producto_id, insumo_id)
);

-- ---------------------------------------------------------------------
-- pedidos: la venta. subtotal/impuesto/total los calcula el servidor.
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id              INTEGER PRIMARY KEY,
  fecha           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  metodo_pago     TEXT    NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'sinpe')),
  subtotal        REAL    NOT NULL CHECK (subtotal >= 0),
  impuesto        REAL    NOT NULL CHECK (impuesto >= 0),
  total           REAL    NOT NULL CHECK (total >= 0),
  estado          TEXT    NOT NULL DEFAULT 'confirmado'
                    CHECK (estado IN ('confirmado', 'anulado')),
  fecha_anulacion TEXT
);

-- ---------------------------------------------------------------------
-- pedido_items: el detalle de cada venta.
-- precio_unitario se COPIA del producto al vender, para conservar el
-- histórico aunque el precio cambie después.
-- Un producto con ventas no se puede borrar (RESTRICT): se desactiva.
-- ---------------------------------------------------------------------
CREATE TABLE pedido_items (
  id              INTEGER PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id)   ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario REAL    NOT NULL CHECK (precio_unitario > 0)
);

CREATE INDEX idx_pedidos_fecha        ON pedidos (fecha);
CREATE INDEX idx_pedido_items_pedido  ON pedido_items (pedido_id);
CREATE INDEX idx_recetas_producto     ON recetas (producto_id);

-- =====================================================================
-- DATOS DE EJEMPLO
-- =====================================================================

-- Tres insumos quedan a propósito por debajo del mínimo
-- (chocolate, croissant y vaso frío) para el panel y el agente de IA.
INSERT INTO insumos (id, nombre, unidad, stock, stock_minimo) VALUES
  ( 1, 'Café en grano',        'g',      2400,  500),
  ( 2, 'Leche entera',         'ml',     9000, 3000),
  ( 3, 'Vaso caliente 12 oz',  'unidad',  160,   50),
  ( 4, 'Azúcar',               'g',      1500,  300),
  ( 5, 'Chocolate en polvo',   'g',       300,  400),
  ( 6, 'Croissant',            'unidad',   12,   15),
  ( 7, 'Queso',                'g',      1200,  300),
  ( 8, 'Jamón',                'g',       900,  300),
  ( 9, 'Hielo',                'g',      6000, 1000),
  (10, 'Bolsita de té chai',   'unidad',   40,   20),
  (11, 'Vaso frío 16 oz',      'unidad',   30,   40),
  (12, 'Galleta artesanal',    'unidad',   25,   10);

INSERT INTO productos (id, nombre, precio, categoria, activo) VALUES
  ( 1, 'Espresso',                  1200, 'bebidas calientes', 1),
  ( 2, 'Americano',                 1400, 'bebidas calientes', 1),
  ( 3, 'Capuchino',                 2000, 'bebidas calientes', 1),
  ( 4, 'Latte',                     2200, 'bebidas calientes', 1),
  ( 5, 'Chocolate caliente',        2100, 'bebidas calientes', 1),
  ( 6, 'Té chai latte',             1800, 'bebidas calientes', 1),
  ( 7, 'Café frío',                 2300, 'bebidas frías',     1),
  ( 8, 'Frappé de chocolate',       2700, 'bebidas frías',     1),
  ( 9, 'Croissant',                 1500, 'panadería',         1),
  (10, 'Croissant jamón y queso',   2600, 'panadería',         1),
  (11, 'Galleta artesanal',          900, 'snacks',            1),
  (12, 'Mocaccino',                 2400, 'bebidas calientes', 0);

INSERT INTO recetas (producto_id, insumo_id, cantidad) VALUES
  -- Espresso
  (1, 1, 18), (1, 3, 1),
  -- Americano
  (2, 1, 18), (2, 3, 1),
  -- Capuchino
  (3, 1, 18), (3, 2, 150), (3, 3, 1),
  -- Latte
  (4, 1, 18), (4, 2, 220), (4, 3, 1),
  -- Chocolate caliente
  (5, 5, 30), (5, 2, 250), (5, 3, 1), (5, 4, 10),
  -- Té chai latte
  (6, 10, 1), (6, 2, 120), (6, 3, 1), (6, 4, 8),
  -- Café frío
  (7, 1, 18), (7, 2, 150), (7, 9, 150), (7, 11, 1),
  -- Frappé de chocolate
  (8, 5, 40), (8, 2, 200), (8, 9, 200), (8, 11, 1), (8, 4, 15),
  -- Croissant
  (9, 6, 1),
  -- Croissant jamón y queso
  (10, 6, 1), (10, 8, 40), (10, 7, 30),
  -- Galleta artesanal
  (11, 12, 1),
  -- Mocaccino (inactivo)
  (12, 1, 18), (12, 5, 20), (12, 2, 180), (12, 3, 1);

-- Ventas de los últimos 7 días. Las fechas son relativas a "ahora",
-- así el panel y el agente siempre tienen datos recientes.
-- Los totales se calculan más abajo con SQL, igual que lo haría la API.
INSERT INTO pedidos (id, fecha, metodo_pago, subtotal, impuesto, total, estado, fecha_anulacion) VALUES
  ( 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-5 hours'),    'efectivo', 0, 0, 0, 'confirmado', NULL),
  ( 2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-3 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  ( 3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days', '-6 hours'),    'sinpe',    0, 0, 0, 'confirmado', NULL),
  ( 4, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days', '-2 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  ( 5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days', '-7 hours'),    'efectivo', 0, 0, 0, 'confirmado', NULL),
  ( 6, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days', '-4 hours'),    'sinpe',    0, 0, 0, 'anulado',
       strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days', '-4 hours', '+10 minutes')),
  ( 7, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days', '-1 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  ( 8, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-6 hours'),    'efectivo', 0, 0, 0, 'confirmado', NULL),
  ( 9, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-2 hours'),    'sinpe',    0, 0, 0, 'confirmado', NULL),
  (10, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days', '-5 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  (11, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days', '-3 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  (12, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days', '-1 hours'),    'efectivo', 0, 0, 0, 'confirmado', NULL),
  (13, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days', '-6 hours'),    'sinpe',    0, 0, 0, 'confirmado', NULL),
  (14, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days', '-4 hours'),    'tarjeta',  0, 0, 0, 'confirmado', NULL),
  (15, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days', '-2 hours'),    'efectivo', 0, 0, 0, 'confirmado', NULL),
  (16, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours'),               'tarjeta',  0, 0, 0, 'confirmado', NULL),
  (17, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'),               'sinpe',    0, 0, 0, 'confirmado', NULL),
  (18, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 minutes'),            'efectivo', 0, 0, 0, 'confirmado', NULL),
  (19, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hours'),               'tarjeta',  0, 0, 0, 'confirmado', NULL),
  (20, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-40 minutes'),            'sinpe',    0, 0, 0, 'confirmado', NULL);

-- El precio_unitario se toma del producto (como hace la API al vender).
-- (column1, column2, column3 son los nombres que SQLite les da a las
-- columnas de un VALUES.)
INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
SELECT v.column1, v.column2, v.column3, p.precio
FROM (VALUES
  ( 1, 3, 2), ( 1, 9, 1),
  ( 2, 4, 1), ( 2, 10, 1),
  ( 3, 1, 2), ( 3, 11, 2),
  ( 4, 7, 2), ( 4, 9, 2),
  ( 5, 3, 1), ( 5, 5, 1), ( 5, 11, 1),
  ( 6, 8, 2),
  ( 7, 2, 3), ( 7, 10, 2),
  ( 8, 4, 2), ( 8, 9, 1),
  ( 9, 6, 1), ( 9, 11, 3),
  (10, 3, 3), (10, 10, 1),
  (11, 7, 1), (11, 8, 1),
  (12, 1, 1), (12, 9, 2),
  (13, 4, 1), (13, 5, 2),
  (14, 3, 2), (14, 10, 2),
  (15, 2, 2), (15, 11, 1),
  (16, 3, 1), (16, 9, 1),
  (17, 4, 2), (17, 10, 1),
  (18, 7, 2),
  (19, 1, 2), (19, 11, 2),
  (20, 3, 1), (20, 8, 1)
) AS v
JOIN productos p ON p.id = v.column2;

-- Totales: subtotal = Σ precio × cantidad, impuesto = 13 %, total = suma.
UPDATE pedidos
SET subtotal = t.subtotal,
    impuesto = ROUND(t.subtotal * 0.13, 2),
    total    = ROUND(t.subtotal + ROUND(t.subtotal * 0.13, 2), 2)
FROM (
  SELECT pedido_id, SUM(cantidad * precio_unitario) AS subtotal
  FROM pedido_items
  GROUP BY pedido_id
) AS t
WHERE pedidos.id = t.pedido_id;

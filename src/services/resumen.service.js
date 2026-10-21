// Métricas del negocio, calculadas con SQL (SUM, COUNT, GROUP BY).
// Solo cuentan las ventas CONFIRMADAS: un pedido anulado no es venta.
import { query } from '../db.js';
import * as validar from '../utils/validar.js';

// Cada consulta arranca con este CTE: "dia" es la fecha pedida o, si
// no mandan ninguna, el día de hoy en la hora local de la computadora.
const CON_DIA = "WITH dia AS (SELECT COALESCE(?, date('now', 'localtime')) AS d)";

// Fecha local (Costa Rica) de cada pedido, que se guarda en UTC
const DIA_PEDIDO = "date(pe.fecha, 'localtime')";

/**
 * GET /api/resumen?fecha=2026-10-21   (sin fecha = hoy)
 * Cierre de caja del día + indicadores para el panel.
 */
export function resumen(filtros = {}) {
  const fecha = validar.fechaQuery(filtros.fecha) ?? null;

  // Totales del día
  const totales = query(
    `${CON_DIA}
     SELECT dia.d                                 AS fecha,
            COUNT(pe.id)                          AS pedidos,
            ROUND(COALESCE(SUM(pe.subtotal), 0), 2) AS subtotal,
            ROUND(COALESCE(SUM(pe.impuesto), 0), 2) AS impuesto,
            ROUND(COALESCE(SUM(pe.total), 0), 2)    AS total,
            ROUND(COALESCE(AVG(pe.total), 0), 2)    AS ticket_promedio
     FROM dia
     LEFT JOIN pedidos pe ON ${DIA_PEDIDO} = dia.d AND pe.estado = 'confirmado'`,
    [fecha]
  ).rows[0];

  // Cierre de caja: total por método de pago (aparecen los 3 aunque sea en 0)
  const porMetodo = query(
    `${CON_DIA},
     metodos(metodo_pago) AS (VALUES ('efectivo'), ('tarjeta'), ('sinpe'))
     SELECT m.metodo_pago,
            COUNT(pe.id)                            AS pedidos,
            ROUND(COALESCE(SUM(pe.total), 0), 2)    AS total
     FROM metodos m
     CROSS JOIN dia
     LEFT JOIN pedidos pe
            ON pe.metodo_pago = m.metodo_pago
           AND ${DIA_PEDIDO} = dia.d
           AND pe.estado = 'confirmado'
     GROUP BY m.metodo_pago
     ORDER BY total DESC, m.metodo_pago`,
    [fecha]
  ).rows;

  // Los 5 productos más vendidos del día
  const top = query(
    `${CON_DIA}
     SELECT p.id AS producto_id, p.nombre,
            SUM(pi.cantidad)                               AS unidades,
            ROUND(SUM(pi.cantidad * pi.precio_unitario), 2) AS vendido
     FROM pedido_items pi
     JOIN pedidos pe  ON pe.id = pi.pedido_id
     JOIN productos p ON p.id = pi.producto_id
     CROSS JOIN dia
     WHERE ${DIA_PEDIDO} = dia.d AND pe.estado = 'confirmado'
     GROUP BY p.id, p.nombre
     ORDER BY unidades DESC, vendido DESC
     LIMIT 5`,
    [fecha]
  ).rows;

  // Pedidos del día por estado (incluye anulados)
  const porEstado = query(
    `${CON_DIA}
     SELECT pe.estado, COUNT(*) AS pedidos
     FROM pedidos pe CROSS JOIN dia
     WHERE ${DIA_PEDIDO} = dia.d
     GROUP BY pe.estado
     ORDER BY pe.estado`,
    [fecha]
  ).rows;

  // Ventas de los 7 días que terminan en la fecha (para un gráfico).
  // "dias" es un CTE recursivo que genera las 7 fechas, una por fila.
  const semana = query(
    `${CON_DIA},
     dias(f) AS (
       SELECT date(d, '-6 days') FROM dia
       UNION ALL
       SELECT date(f, '+1 day') FROM dias, dia WHERE f < dia.d
     )
     SELECT dias.f                                AS fecha,
            COUNT(pe.id)                          AS pedidos,
            ROUND(COALESCE(SUM(pe.total), 0), 2)  AS total
     FROM dias
     LEFT JOIN pedidos pe ON ${DIA_PEDIDO} = dias.f AND pe.estado = 'confirmado'
     GROUP BY dias.f
     ORDER BY dias.f`,
    [fecha]
  ).rows;

  // Cuántos insumos están por debajo del mínimo (ahora mismo)
  const bajoMinimo = query('SELECT COUNT(*) AS cantidad FROM insumos WHERE stock < stock_minimo').rows[0];

  return {
    ...totales,
    por_metodo_pago: porMetodo,
    top_productos: top,
    pedidos_por_estado: porEstado,
    ventas_ultimos_7_dias: semana,
    insumos_bajo_minimo: bajoMinimo.cantidad,
  };
}

/**
 * GET /api/resumen/compras
 * Datos para el agente de IA (Día 2): insumos bajo el mínimo + consumo
 * real de los últimos 7 días (ventas × receta) + días de cobertura.
 */
export function compras() {
  const { rows: insumos } = query(
    `WITH consumo AS (
       SELECT r.insumo_id, SUM(pi.cantidad * r.cantidad) AS usado
       FROM pedido_items pi
       JOIN pedidos pe ON pe.id = pi.pedido_id
       JOIN recetas r  ON r.producto_id = pi.producto_id
       WHERE pe.estado = 'confirmado'
         AND julianday(pe.fecha) >= julianday('now', '-7 days')
       GROUP BY r.insumo_id
     )
     SELECT i.id, i.nombre, i.unidad, i.stock, i.stock_minimo,
            (i.stock < i.stock_minimo)                  AS bajo_minimo,
            COALESCE(c.usado, 0)                        AS consumo_7_dias,
            ROUND(COALESCE(c.usado, 0) / 7.0, 2)        AS consumo_diario,
            CASE WHEN COALESCE(c.usado, 0) = 0 THEN NULL
                 ELSE ROUND(i.stock / (c.usado / 7.0), 1) END AS dias_de_cobertura
     FROM insumos i
     LEFT JOIN consumo c ON c.insumo_id = i.id
     ORDER BY bajo_minimo DESC, dias_de_cobertura IS NULL, dias_de_cobertura, i.nombre`
  );

  const { rows: ventas } = query(
    `SELECT p.nombre, SUM(pi.cantidad) AS unidades
     FROM pedido_items pi
     JOIN pedidos pe  ON pe.id = pi.pedido_id
     JOIN productos p ON p.id = pi.producto_id
     WHERE pe.estado = 'confirmado'
       AND julianday(pe.fecha) >= julianday('now', '-7 days')
     GROUP BY p.nombre
     ORDER BY unidades DESC`
  );

  return {
    periodo_dias: 7,
    insumos_bajo_minimo: insumos.filter((i) => i.bajo_minimo),
    insumos,
    ventas_semana: ventas,
  };
}

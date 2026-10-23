// Métricas del negocio, calculadas con SQL (SUM, COUNT, GROUP BY).
// Solo cuentan las ventas CONFIRMADAS: un pedido anulado no es venta.
import { pool } from '../db.js';
import * as validar from '../utils/validar.js';

/**
 * GET /api/resumen?fecha=2026-10-21   (sin fecha = hoy)
 * Cierre de caja del día + indicadores para el panel.
 */
export async function resumen(filtros = {}) {
  const fecha = validar.fechaQuery(filtros.fecha) ?? null;
  // COALESCE($1::date, CURRENT_DATE): si no mandan fecha, usamos hoy
  // (CURRENT_DATE respeta la zona horaria configurada en db.js).
  const dia = 'COALESCE($1::date, CURRENT_DATE)';

  const [totales, porMetodo, top, porEstado, semana, bajoMinimo] = await Promise.all([
    // Totales del día
    pool.query(
      `SELECT ${dia}::text AS fecha,
              COUNT(*)::int                       AS pedidos,
              COALESCE(SUM(subtotal), 0)          AS subtotal,
              COALESCE(SUM(impuesto), 0)          AS impuesto,
              COALESCE(SUM(total), 0)             AS total,
              COALESCE(ROUND(AVG(total), 2), 0)   AS ticket_promedio
       FROM pedidos
       WHERE fecha::date = ${dia} AND estado = 'confirmado'`,
      [fecha]
    ),

    // Cierre de caja: total por método de pago (aparecen los 3 aunque sea en 0)
    pool.query(
      `SELECT m.metodo_pago,
              COUNT(pe.id)::int              AS pedidos,
              COALESCE(SUM(pe.total), 0)     AS total
       FROM (VALUES ('efectivo'), ('tarjeta'), ('sinpe')) AS m(metodo_pago)
       LEFT JOIN pedidos pe
              ON pe.metodo_pago = m.metodo_pago
             AND pe.fecha::date = ${dia}
             AND pe.estado = 'confirmado'
       GROUP BY m.metodo_pago
       ORDER BY total DESC, m.metodo_pago`,
      [fecha]
    ),

    // Los 5 productos más vendidos del día
    pool.query(
      `SELECT p.id AS producto_id, p.nombre,
              SUM(pi.cantidad)::int                    AS unidades,
              SUM(pi.cantidad * pi.precio_unitario)    AS vendido
       FROM pedido_items pi
       JOIN pedidos pe  ON pe.id = pi.pedido_id
       JOIN productos p ON p.id = pi.producto_id
       WHERE pe.fecha::date = ${dia} AND pe.estado = 'confirmado'
       GROUP BY p.id, p.nombre
       ORDER BY unidades DESC, vendido DESC
       LIMIT 5`,
      [fecha]
    ),

    // Pedidos del día por estado (incluye anulados)
    pool.query(
      `SELECT estado, COUNT(*)::int AS pedidos
       FROM pedidos
       WHERE fecha::date = ${dia}
       GROUP BY estado
       ORDER BY estado`,
      [fecha]
    ),

    // Ventas de los 7 días que terminan en la fecha (para el gráfico)
    pool.query(
      `SELECT d::date::text AS fecha,
              COUNT(pe.id)::int          AS pedidos,
              COALESCE(SUM(pe.total), 0) AS total
       FROM generate_series(${dia} - 6, ${dia}, interval '1 day') AS d
       LEFT JOIN pedidos pe
              ON pe.fecha::date = d::date AND pe.estado = 'confirmado'
       GROUP BY d
       ORDER BY d`,
      [fecha]
    ),

    // Cuántos insumos están por debajo del mínimo (ahora mismo)
    pool.query('SELECT COUNT(*)::int AS cantidad FROM insumos WHERE stock < stock_minimo'),
  ]);

  return {
    ...totales.rows[0],
    por_metodo_pago: porMetodo.rows,
    top_productos: top.rows,
    pedidos_por_estado: porEstado.rows,
    ventas_ultimos_7_dias: semana.rows,
    insumos_bajo_minimo: bajoMinimo.rows[0].cantidad,
  };
}

/**
 * GET /api/resumen/compras
 * Datos para el agente de IA: insumos bajo el mínimo + consumo real de
 * los últimos 7 días (ventas × receta) + días de cobertura.
 */
export async function compras() {
  const { rows: insumos } = await pool.query(
    `WITH consumo AS (
       SELECT r.insumo_id, SUM(pi.cantidad * r.cantidad) AS usado
       FROM pedido_items pi
       JOIN pedidos pe ON pe.id = pi.pedido_id
       JOIN recetas r  ON r.producto_id = pi.producto_id
       WHERE pe.estado = 'confirmado' AND pe.fecha >= now() - interval '7 days'
       GROUP BY r.insumo_id
     )
     SELECT i.id, i.nombre, i.unidad, i.stock, i.stock_minimo,
            (i.stock < i.stock_minimo)                       AS bajo_minimo,
            COALESCE(c.usado, 0)                             AS consumo_7_dias,
            ROUND(COALESCE(c.usado, 0) / 7.0, 2)             AS consumo_diario,
            CASE WHEN COALESCE(c.usado, 0) = 0 THEN NULL
                 ELSE ROUND(i.stock / (c.usado / 7.0), 1) END AS dias_de_cobertura
     FROM insumos i
     LEFT JOIN consumo c ON c.insumo_id = i.id
     ORDER BY bajo_minimo DESC, dias_de_cobertura ASC NULLS LAST, i.nombre`
  );

  const { rows: ventas } = await pool.query(
    `SELECT p.nombre, SUM(pi.cantidad)::int AS unidades
     FROM pedido_items pi
     JOIN pedidos pe  ON pe.id = pi.pedido_id
     JOIN productos p ON p.id = pi.producto_id
     WHERE pe.estado = 'confirmado' AND pe.fecha >= now() - interval '7 days'
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

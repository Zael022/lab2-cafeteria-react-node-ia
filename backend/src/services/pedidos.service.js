// Reglas y consultas de PEDIDOS (las ventas). Aquí vive la lógica
// más importante del caso: totales, disponibilidad por receta,
// descuento de insumos y anulación.
import { pool, withTransaction } from '../db.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import * as validar from '../utils/validar.js';
import {
  ESTADOS_PEDIDO,
  IMPUESTO,
  METODOS_PAGO,
  MINUTOS_PARA_ANULAR,
} from '../utils/constantes.js';

/**
 * GET /api/pedidos?fecha=2026-10-21&estado=confirmado&metodo_pago=sinpe
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const params = [];

  const fecha = validar.fechaQuery(filtros.fecha);
  if (fecha) {
    params.push(fecha);
    condiciones.push(`pe.fecha::date = $${params.length}`);
  }
  if (filtros.estado) {
    params.push(validar.opcion(filtros.estado, 'estado', ESTADOS_PEDIDO));
    condiciones.push(`pe.estado = $${params.length}`);
  }
  if (filtros.metodo_pago) {
    params.push(validar.opcion(filtros.metodo_pago, 'metodo_pago', METODOS_PAGO));
    condiciones.push(`pe.metodo_pago = $${params.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT pe.id, pe.fecha, pe.metodo_pago, pe.subtotal, pe.impuesto, pe.total, pe.estado,
            COALESCE(SUM(pi.cantidad), 0)::int AS unidades
     FROM pedidos pe
     LEFT JOIN pedido_items pi ON pi.pedido_id = pe.id
     ${where}
     GROUP BY pe.id
     ORDER BY pe.fecha DESC`,
    params
  );
  return rows;
}

/**
 * GET /api/pedidos/:id → pedido + items (con nombre del producto) +
 * si todavía se puede anular y cuántos minutos quedan.
 */
export async function obtener(id, client = pool) {
  const { rows } = await client.query(
    `SELECT id, fecha, metodo_pago, subtotal, impuesto, total, estado, fecha_anulacion,
            (estado = 'confirmado'
              AND now() - fecha <= make_interval(mins => $2)) AS se_puede_anular,
            GREATEST(0, CEIL($2 - EXTRACT(EPOCH FROM (now() - fecha)) / 60))::int AS minutos_para_anular
     FROM pedidos WHERE id = $1`,
    [id, MINUTOS_PARA_ANULAR]
  );
  if (rows.length === 0) throw notFound(`El pedido ${id} no existe`);

  const { rows: items } = await client.query(
    `SELECT pi.id, pi.producto_id, p.nombre, pi.cantidad, pi.precio_unitario,
            (pi.cantidad * pi.precio_unitario) AS importe
     FROM pedido_items pi
     JOIN productos p ON p.id = pi.producto_id
     WHERE pi.pedido_id = $1
     ORDER BY pi.id`,
    [id]
  );

  const pedido = rows[0];
  if (pedido.estado === 'anulado') pedido.minutos_para_anular = 0;
  return { ...pedido, items };
}

/** Valida el body y junta items repetidos del mismo producto. */
function validarPedido(body = {}) {
  const metodo_pago = validar.opcion(body.metodo_pago, 'metodo_pago', METODOS_PAGO);

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw badRequest('El pedido debe tener al menos un item');
  }

  // Si mandan dos líneas de "Capuchino", las sumamos en una sola.
  const porProducto = new Map();
  body.items.forEach((item, i) => {
    const productoId = validar.id(item?.producto_id, `producto_id del item ${i + 1}`);
    const cantidad = validar.entero(item.cantidad, `cantidad del item ${i + 1}`);
    porProducto.set(productoId, (porProducto.get(productoId) ?? 0) + cantidad);
  });

  const items = [...porProducto].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
  return { metodo_pago, items };
}

/**
 * POST /api/pedidos → crea Y confirma la venta.
 *
 * Todo sucede en UNA transacción:
 *  1. Leer los productos (existen y están activos).
 *  2. Calcular cuánto de cada insumo hace falta (sumando todas las recetas).
 *  3. Bloquear esos insumos (FOR UPDATE) y revisar que alcancen → si no, 409.
 *  4. Calcular subtotal, impuesto (13 %) y total EN EL SERVIDOR.
 *  5. Insertar el pedido y sus items (guardando el precio del momento).
 *  6. Descontar los insumos.
 * Si cualquier paso falla → ROLLBACK y no queda nada a medias.
 */
export async function crear(body) {
  const { metodo_pago, items } = validarPedido(body);
  const idsProductos = items.map((i) => i.producto_id);

  return withTransaction(async (client) => {
    // 1. Productos
    const { rows: productos } = await client.query(
      'SELECT id, nombre, precio, activo FROM productos WHERE id = ANY($1::int[])',
      [idsProductos]
    );
    const productoPorId = new Map(productos.map((p) => [p.id, p]));

    const noExisten = idsProductos.filter((id) => !productoPorId.has(id));
    if (noExisten.length > 0) {
      throw badRequest(`No existe(n) el/los producto(s): ${noExisten.join(', ')}`);
    }
    const inactivos = productos.filter((p) => !p.activo);
    if (inactivos.length > 0) {
      throw conflict(`No se puede vender: ${inactivos.map((p) => p.nombre).join(', ')} está(n) inactivo(s)`);
    }

    // 2. Requerimiento total por insumo.
    //    Ej.: 2 capuchinos (150 ml leche c/u) + 1 latte (220 ml) = 520 ml de leche.
    const { rows: recetas } = await client.query(
      'SELECT producto_id, insumo_id, cantidad FROM recetas WHERE producto_id = ANY($1::int[])',
      [idsProductos]
    );
    const sinReceta = items.filter((it) => !recetas.some((r) => r.producto_id === it.producto_id));
    if (sinReceta.length > 0) {
      const nombres = sinReceta.map((it) => productoPorId.get(it.producto_id).nombre).join(', ');
      throw conflict(`No se puede preparar ${nombres}: no tiene receta`);
    }

    const requerido = new Map(); // insumo_id → cantidad total necesaria
    for (const item of items) {
      for (const r of recetas.filter((rec) => rec.producto_id === item.producto_id)) {
        requerido.set(r.insumo_id, (requerido.get(r.insumo_id) ?? 0) + r.cantidad * item.cantidad);
      }
    }

    // 3. Bloqueamos las filas de esos insumos hasta el COMMIT.
    //    Si dos cajeros venden el último croissant al mismo tiempo, el
    //    segundo espera aquí y luego ve el stock ya descontado.
    //    ORDER BY id evita bloqueos cruzados (deadlocks).
    const { rows: insumos } = await client.query(
      `SELECT id, nombre, unidad, stock FROM insumos
       WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE`,
      [[...requerido.keys()]]
    );

    const faltantes = insumos
      .filter((ins) => ins.stock < requerido.get(ins.id))
      .map((ins) => {
        const falta = validar.redondear2(requerido.get(ins.id) - ins.stock);
        const unidad = ins.unidad === 'unidad' && falta !== 1 ? 'unidades' : ins.unidad;
        return `${ins.nombre} (faltan ${falta} ${unidad})`;
      });
    if (faltantes.length > 0) {
      throw conflict(`No hay insumos suficientes para preparar el pedido: ${faltantes.join('; ')}`);
    }

    // 4. Totales (el front NUNCA manda precios ni totales)
    const subtotal = validar.redondear2(
      items.reduce((suma, it) => suma + productoPorId.get(it.producto_id).precio * it.cantidad, 0)
    );
    const impuesto = validar.redondear2(subtotal * IMPUESTO);
    const total = validar.redondear2(subtotal + impuesto);

    // 5. Pedido + items
    const { rows: nuevo } = await client.query(
      `INSERT INTO pedidos (metodo_pago, subtotal, impuesto, total, estado)
       VALUES ($1, $2, $3, $4, 'confirmado') RETURNING id`,
      [metodo_pago, subtotal, impuesto, total]
    );
    const pedidoId = nuevo[0].id;

    for (const it of items) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, it.producto_id, it.cantidad, productoPorId.get(it.producto_id).precio]
      );
    }

    // 6. Descontar insumos
    for (const [insumoId, cantidad] of requerido) {
      await client.query('UPDATE insumos SET stock = stock - $1 WHERE id = $2', [cantidad, insumoId]);
    }

    return obtener(pedidoId, client);
  });
}

/**
 * PATCH /api/pedidos/:id/anular
 * Reglas:
 *  - Solo pedidos confirmados (anular dos veces → 409).
 *  - Solo dentro de los primeros 15 minutos (después → 409).
 *  - Al anular se devuelven los insumos de todas las recetas.
 * Toca pedidos + insumos → transacción.
 */
export async function anular(id) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, estado,
              (now() - fecha <= make_interval(mins => $2)) AS dentro_del_plazo
       FROM pedidos WHERE id = $1 FOR UPDATE`,
      [id, MINUTOS_PARA_ANULAR]
    );
    if (rows.length === 0) throw notFound(`El pedido ${id} no existe`);

    const pedido = rows[0];
    if (pedido.estado === 'anulado') {
      throw conflict(`El pedido ${id} ya está anulado`);
    }
    if (!pedido.dentro_del_plazo) {
      throw conflict(
        `El pedido ${id} ya no se puede anular: solo se permite en los primeros ${MINUTOS_PARA_ANULAR} minutos`
      );
    }

    // Insumos a devolver = Σ (cantidad vendida × cantidad de la receta)
    await client.query(
      `UPDATE insumos i
       SET stock = i.stock + d.devolver
       FROM (
         SELECT r.insumo_id, SUM(pi.cantidad * r.cantidad) AS devolver
         FROM pedido_items pi
         JOIN recetas r ON r.producto_id = pi.producto_id
         WHERE pi.pedido_id = $1
         GROUP BY r.insumo_id
       ) d
       WHERE i.id = d.insumo_id`,
      [id]
    );

    await client.query(`UPDATE pedidos SET estado = 'anulado', fecha_anulacion = now() WHERE id = $1`, [id]);

    return obtener(id, client);
  });
}

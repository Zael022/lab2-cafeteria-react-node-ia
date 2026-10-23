// Reglas y consultas de PRODUCTOS y sus RECETAS.
import { pool, withTransaction } from '../db.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import * as validar from '../utils/validar.js';
import { CATEGORIAS } from '../utils/constantes.js';
import { verificarQueExisten } from './insumos.service.js';

// Lista blanca para ORDER BY (ver explicación en insumos.service.js)
const ORDENES = {
  nombre: 'nombre',
  precio: 'precio',
  categoria: 'categoria',
  porciones: 'porciones_disponibles',
};

/*
 * ¿Cuántas unidades de un producto se pueden preparar?
 * Para cada insumo de la receta: FLOOR(stock / cantidad_por_unidad).
 * El producto alcanza para el MÍNIMO de esos valores (el insumo que se
 * acaba primero manda). Ej.: café alcanza para 133 y vasos para 160
 * → se pueden hacer 133 capuchinos.
 */
const SQL_PRODUCTOS = `
  SELECT t.*, (t.activo AND t.porciones_disponibles > 0) AS disponible
  FROM (
    SELECT p.id, p.nombre, p.precio, p.categoria, p.activo,
           COALESCE(MIN(FLOOR(i.stock / r.cantidad)), 0)::int AS porciones_disponibles
    FROM productos p
    LEFT JOIN recetas r ON r.producto_id = p.id
    LEFT JOIN insumos i ON i.id = r.insumo_id
    GROUP BY p.id
  ) t
`;

/** Valida el body de POST/PUT. La receta viene dentro del producto. */
function validarDatos(body = {}) {
  const datos = {
    nombre: validar.texto(body.nombre, 'nombre'),
    precio: validar.numero(body.precio, 'precio'),
    categoria: validar.opcion(body.categoria, 'categoria', CATEGORIAS),
    activo: body.activo === undefined ? true : validar.booleano(body.activo, 'activo'),
  };

  if (!Array.isArray(body.receta) || body.receta.length === 0) {
    throw badRequest('El producto necesita una receta con al menos un insumo');
  }

  const vistos = new Set();
  datos.receta = body.receta.map((linea, i) => {
    const insumo_id = validar.id(linea?.insumo_id, `insumo_id de la línea ${i + 1} de la receta`);
    if (vistos.has(insumo_id)) {
      throw badRequest(`El insumo ${insumo_id} aparece dos veces en la receta`);
    }
    vistos.add(insumo_id);
    const cantidad = validar.numero(linea.cantidad, `cantidad de la línea ${i + 1} de la receta`);
    return { insumo_id, cantidad };
  });

  return datos;
}

async function verificarNombreLibre(client, nombre, idActual = 0) {
  const { rowCount } = await client.query(
    'SELECT 1 FROM productos WHERE lower(nombre) = lower($1) AND id <> $2',
    [nombre, idActual]
  );
  if (rowCount > 0) throw conflict(`Ya existe un producto llamado "${nombre}"`);
}

async function guardarReceta(client, productoId, receta) {
  for (const linea of receta) {
    await client.query(
      'INSERT INTO recetas (producto_id, insumo_id, cantidad) VALUES ($1, $2, $3)',
      [productoId, linea.insumo_id, linea.cantidad]
    );
  }
}

/**
 * GET /api/productos?q=cafe&categoria=panadería&activo=true&disponible=true&orden=precio&dir=desc
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const params = [];

  if (filtros.q) {
    params.push(`%${filtros.q}%`);
    condiciones.push(`t.nombre ILIKE $${params.length}`);
  }
  if (filtros.categoria) {
    params.push(validar.opcion(filtros.categoria, 'categoria', CATEGORIAS));
    condiciones.push(`t.categoria = $${params.length}`);
  }
  const activo = validar.booleanoQuery(filtros.activo, 'activo');
  if (activo !== undefined) {
    params.push(activo);
    condiciones.push(`t.activo = $${params.length}`);
  }
  const disponible = validar.booleanoQuery(filtros.disponible, 'disponible');
  if (disponible !== undefined) {
    params.push(disponible);
    condiciones.push(`(t.activo AND t.porciones_disponibles > 0) = $${params.length}`);
  }

  const columna = ORDENES[filtros.orden] ?? ORDENES.nombre;
  const direccion = filtros.dir === 'desc' ? 'DESC' : 'ASC';
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await pool.query(`${SQL_PRODUCTOS} ${where} ORDER BY t.${columna} ${direccion}, t.id`, params);
  return rows;
}

/**
 * GET /api/productos/:id → producto + receta (con el stock de cada
 * insumo) + cuántas unidades se han vendido.
 * Recibe `client` opcional para poder usarse dentro de una transacción.
 */
export async function obtener(id, client = pool) {
  const { rows } = await client.query(`${SQL_PRODUCTOS} WHERE t.id = $1`, [id]);
  if (rows.length === 0) throw notFound(`El producto ${id} no existe`);

  const { rows: receta } = await client.query(
    `SELECT r.insumo_id, i.nombre, i.unidad, r.cantidad, i.stock,
            FLOOR(i.stock / r.cantidad)::int AS alcanza_para
     FROM recetas r
     JOIN insumos i ON i.id = r.insumo_id
     WHERE r.producto_id = $1
     ORDER BY i.nombre`,
    [id]
  );

  const { rows: ventas } = await client.query(
    `SELECT COALESCE(SUM(pi.cantidad), 0)::int AS unidades_vendidas
     FROM pedido_items pi
     JOIN pedidos pe ON pe.id = pi.pedido_id
     WHERE pi.producto_id = $1 AND pe.estado = 'confirmado'`,
    [id]
  );

  return { ...rows[0], receta, unidades_vendidas: ventas[0].unidades_vendidas };
}

/**
 * POST /api/productos
 * Toca DOS tablas (productos + recetas) → transacción: si falla una
 * línea de la receta, tampoco queda el producto a medias.
 */
export async function crear(body) {
  const datos = validarDatos(body);
  await verificarQueExisten(datos.receta.map((l) => l.insumo_id));

  return withTransaction(async (client) => {
    await verificarNombreLibre(client, datos.nombre);
    const { rows } = await client.query(
      `INSERT INTO productos (nombre, precio, categoria, activo)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [datos.nombre, datos.precio, datos.categoria, datos.activo]
    );
    const id = rows[0].id;
    await guardarReceta(client, id, datos.receta);
    return obtener(id, client);
  });
}

/**
 * PUT /api/productos/:id
 * Reemplaza los datos y la receta completa (borrar + insertar) en una
 * transacción.
 * El precio nuevo solo afecta ventas futuras: las anteriores conservan
 * su precio_unitario en pedido_items.
 */
export async function actualizar(id, body) {
  const datos = validarDatos(body);
  await verificarQueExisten(datos.receta.map((l) => l.insumo_id));

  return withTransaction(async (client) => {
    const { rowCount } = await client.query('SELECT 1 FROM productos WHERE id = $1 FOR UPDATE', [id]);
    if (rowCount === 0) throw notFound(`El producto ${id} no existe`);

    await verificarNombreLibre(client, datos.nombre, id);
    await client.query(
      `UPDATE productos SET nombre = $1, precio = $2, categoria = $3, activo = $4
       WHERE id = $5`,
      [datos.nombre, datos.precio, datos.categoria, datos.activo, id]
    );
    await client.query('DELETE FROM recetas WHERE producto_id = $1', [id]);
    await guardarReceta(client, id, datos.receta);
    return obtener(id, client);
  });
}

/**
 * DELETE /api/productos/:id
 * Regla: un producto con ventas no se borra (perderíamos el histórico);
 * se desactiva con PUT activo=false. Responde 409.
 */
export async function eliminar(id) {
  const { rows } = await pool.query('SELECT nombre FROM productos WHERE id = $1', [id]);
  if (rows.length === 0) throw notFound(`El producto ${id} no existe`);

  const { rowCount } = await pool.query('SELECT 1 FROM pedido_items WHERE producto_id = $1 LIMIT 1', [id]);
  if (rowCount > 0) {
    throw conflict(
      `No se puede eliminar "${rows[0].nombre}" porque tiene ventas registradas. Desactívelo en su lugar.`
    );
  }
  // La receta se borra sola por ON DELETE CASCADE
  await pool.query('DELETE FROM productos WHERE id = $1', [id]);
}

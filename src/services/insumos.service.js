// Reglas y consultas de INSUMOS (la materia prima).
import { query } from '../db.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import * as validar from '../utils/validar.js';
import { UNIDADES } from '../utils/constantes.js';

// ORDER BY no acepta parámetros (?), así que NUNCA se arma con lo que
// manda el cliente. Usamos una "lista blanca": solo estos valores.
const ORDENES = {
  nombre: 'nombre',
  stock: 'stock',
  faltante: '(stock - stock_minimo)',
};

/** Valida el body de POST/PUT y devuelve los datos limpios. */
function validarDatos(body = {}) {
  return {
    nombre: validar.texto(body.nombre, 'nombre'),
    unidad: validar.opcion(body.unidad, 'unidad', UNIDADES),
    stock: validar.numero(body.stock ?? 0, 'stock', { permiteCero: true }),
    stock_minimo: validar.numero(body.stock_minimo ?? 0, 'stock_minimo', { permiteCero: true }),
  };
}

function verificarNombreLibre(nombre, idActual = 0) {
  const { rowCount } = query(
    'SELECT 1 FROM insumos WHERE lower(nombre) = lower(?) AND id <> ?',
    [nombre, idActual]
  );
  if (rowCount > 0) throw conflict(`Ya existe un insumo llamado "${nombre}"`);
}

/**
 * GET /api/insumos?q=leche&bajo_minimo=true&orden=stock&dir=desc
 */
export function listar(filtros = {}) {
  const condiciones = [];
  const params = [];

  if (filtros.q) {
    // LIKE en SQLite no distingue mayúsculas de minúsculas (en letras sin tilde)
    condiciones.push('nombre LIKE ?');
    params.push(`%${filtros.q}%`);
  }
  const bajoMinimo = validar.booleanoQuery(filtros.bajo_minimo, 'bajo_minimo');
  if (bajoMinimo !== undefined) {
    condiciones.push(bajoMinimo ? 'stock < stock_minimo' : 'stock >= stock_minimo');
  }

  const columna = ORDENES[filtros.orden] ?? ORDENES.nombre;
  const direccion = filtros.dir === 'desc' ? 'DESC' : 'ASC';
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  return query(
    `SELECT id, nombre, unidad, stock, stock_minimo,
            (stock < stock_minimo) AS bajo_minimo
     FROM insumos
     ${where}
     ORDER BY ${columna} ${direccion}, id`,
    params
  ).rows;
}

/**
 * GET /api/insumos/:id → el insumo + los productos que lo usan.
 */
export function obtener(id) {
  const { rows } = query(
    `SELECT id, nombre, unidad, stock, stock_minimo,
            (stock < stock_minimo) AS bajo_minimo
     FROM insumos WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) throw notFound(`El insumo ${id} no existe`);

  const { rows: usadoEn } = query(
    `SELECT p.id AS producto_id, p.nombre, r.cantidad
     FROM recetas r
     JOIN productos p ON p.id = r.producto_id
     WHERE r.insumo_id = ?
     ORDER BY p.nombre`,
    [id]
  );
  return { ...rows[0], usado_en: usadoEn };
}

/** POST /api/insumos */
export function crear(body) {
  const datos = validarDatos(body);
  verificarNombreLibre(datos.nombre);

  const { rows } = query(
    `INSERT INTO insumos (nombre, unidad, stock, stock_minimo)
     VALUES (?, ?, ?, ?)
     RETURNING id`,
    [datos.nombre, datos.unidad, datos.stock, datos.stock_minimo]
  );
  return obtener(rows[0].id);
}

/** PUT /api/insumos/:id (reemplaza todos los campos, p. ej. al reabastecer) */
export function actualizar(id, body) {
  const datos = validarDatos(body);
  verificarNombreLibre(datos.nombre, id);

  const { rowCount } = query(
    `UPDATE insumos
     SET nombre = ?, unidad = ?, stock = ?, stock_minimo = ?
     WHERE id = ?`,
    [datos.nombre, datos.unidad, datos.stock, datos.stock_minimo, id]
  );
  if (rowCount === 0) throw notFound(`El insumo ${id} no existe`);
  return obtener(id);
}

/**
 * DELETE /api/insumos/:id
 * Regla: no se puede borrar un insumo que está en alguna receta (409).
 */
export function eliminar(id) {
  const insumo = obtener(id); // 404 si no existe
  if (insumo.usado_en.length > 0) {
    const nombres = insumo.usado_en.map((p) => p.nombre).join(', ');
    throw conflict(
      `No se puede eliminar "${insumo.nombre}": está en la receta de ${nombres}`
    );
  }
  query('DELETE FROM insumos WHERE id = ?', [id]);
}

/**
 * Usado por el servicio de productos: valida que los insumos existan.
 * json_each(?) recibe un arreglo en JSON ("[1,2,3]") y lo convierte en
 * filas, para poder hacer "id IN (...)" con UN solo parámetro.
 */
export function verificarQueExisten(ids) {
  if (ids.length === 0) return;
  const { rows } = query(
    'SELECT id FROM insumos WHERE id IN (SELECT value FROM json_each(?))',
    [ids]
  );
  const existentes = new Set(rows.map((r) => r.id));
  const faltantes = ids.filter((i) => !existentes.has(i));
  if (faltantes.length > 0) {
    throw badRequest(`No existe(n) el/los insumo(s): ${faltantes.join(', ')}`);
  }
}

// Conexión a SQLite usando node:sqlite, el SQLite que YA VIENE dentro de
// Node.js (versión 22.13 o superior). No hay que instalar ni compilar nada.
//
// SQLite no es un servidor: la base de datos es UN archivo
// (backend/cafeteria.db). No hay usuario ni contraseña.
// Analogía: PostgreSQL es una biblioteca con bibliotecaria (un programa
// aparte que atiende pedidos); SQLite es un cuaderno que la API abre
// y escribe directamente.
//
// node:sqlite es SÍNCRONO: cada consulta termina antes de pasar a la
// siguiente línea, por eso los servicios no usan async/await.
import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const carpetaBackend = fileURLToPath(new URL('..', import.meta.url));
export const RUTA_BD = path.resolve(carpetaBackend, process.env.DB_FILE || 'cafeteria.db');

export const db = new DatabaseSync(RUTA_BD);

// SQLite trae las llaves foráneas APAGADAS por defecto: hay que
// encenderlas en cada conexión o los REFERENCES no se respetan.
db.exec('PRAGMA foreign_keys = ON');
// Si otro programa (por ejemplo, la extensión de VS Code) está
// escribiendo, esperamos hasta 5 s en vez de fallar al instante.
db.exec('PRAGMA busy_timeout = 5000');

// SQLite no tiene tipo BOOLEAN: guarda 0 y 1. Estas columnas las
// convertimos a true/false para que el JSON quede limpio.
const COLUMNAS_BOOLEANAS = new Set([
  'activo',
  'disponible',
  'bajo_minimo',
  'se_puede_anular',
  'dentro_del_plazo',
]);

// Y al revés: SQLite no acepta true/false como parámetro, solo números.
// Los arreglos se mandan como JSON para usarlos con json_each(?).
function prepararParametro(valor) {
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (Array.isArray(valor)) return JSON.stringify(valor);
  if (valor === undefined) return null;
  return valor;
}

function convertirFila(fila) {
  const limpia = { ...fila }; // copia como objeto normal de JavaScript
  for (const columna of Object.keys(limpia)) {
    if (COLUMNAS_BOOLEANAS.has(columna) && limpia[columna] !== null) {
      limpia[columna] = limpia[columna] === 1;
    }
  }
  return limpia;
}

// ¿La sentencia devuelve filas? SELECT, WITH ... SELECT o
// INSERT/UPDATE con RETURNING. Las demás solo cambian datos.
function devuelveFilas(sql) {
  return /^\s*(SELECT|WITH)\b/i.test(sql) || /\bRETURNING\b/i.test(sql);
}

/**
 * Ejecuta una consulta parametrizada.
 * Los valores van como "?" y se pasan en el arreglo `params`, NUNCA
 * pegados dentro del texto del SQL (eso evita la inyección SQL).
 *
 * Devuelve { rows, rowCount }: las filas encontradas y cuántas hubo
 * (o, en un UPDATE/DELETE, cuántas filas se modificaron).
 */
export function query(sql, params = []) {
  const sentencia = db.prepare(sql);
  const valores = params.map(prepararParametro);

  if (devuelveFilas(sql)) {
    const rows = sentencia.all(...valores).map(convertirFila);
    return { rows, rowCount: rows.length };
  }
  const info = sentencia.run(...valores);
  return { rows: [], rowCount: Number(info.changes) };
}

/**
 * Ejecuta una función dentro de una transacción.
 *
 * BEGIN IMMEDIATE → abre la transacción y reserva la base para escribir
 * COMMIT          → si todo salió bien, guarda todos los cambios juntos
 * ROLLBACK        → si algo lanzó un error, deshace TODO lo que se hizo
 *
 * ¿Por qué IMMEDIATE? Un BEGIN normal en SQLite no bloquea nada hasta
 * la primera escritura. IMMEDIATE toma el permiso de escritura desde el
 * inicio, así nadie más puede cambiar el stock entre que lo leemos y
 * lo descontamos (es el equivalente a SELECT ... FOR UPDATE de PostgreSQL).
 */
export function withTransaction(trabajo) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const resultado = trabajo();
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error; // el middleware de errores decide el código HTTP
  }
}

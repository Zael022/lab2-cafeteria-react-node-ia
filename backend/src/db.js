// Conexión a PostgreSQL con un Pool de pg.
//
// Analogía: el Pool es como tener varias cajeras listas. En vez de abrir
// y cerrar una conexión por cada petición (lento), se reutilizan.
//
// PostgreSQL corre en Docker (ver docker-compose.yml en la raíz).
import 'dotenv/config';
import pg from 'pg';

const { Pool, types } = pg;

// Por defecto pg devuelve NUMERIC (1700) y BIGINT/COUNT (20) como texto
// para no perder precisión. Nuestros montos caben sin problema en un
// número de JavaScript, así que los convertimos para que el JSON
// tenga 2000 y no "2000.00".
types.setTypeParser(1700, (valor) => Number(valor));
types.setTypeParser(20, (valor) => Number(valor));

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cafeteria';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Cada conexión usa la zona horaria del negocio: así fecha::date y
  // CURRENT_DATE significan "el día en Costa Rica" y no "el día en UTC".
  options: `-c TimeZone=${process.env.TIMEZONE || 'America/Costa_Rica'}`,
});

/**
 * Ejecuta una función dentro de una transacción.
 *
 * BEGIN    → abre la transacción
 * COMMIT   → si todo salió bien, guarda todos los cambios juntos
 * ROLLBACK → si algo lanzó un error, deshace TODO lo que se hizo
 *
 * Importante: todas las consultas de la transacción deben usar el mismo
 * `client` (no `pool.query`), porque la transacción vive en UNA conexión.
 */
export async function withTransaction(trabajo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await trabajo(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error; // el middleware de errores decide el código HTTP
  } finally {
    client.release(); // devolvemos la conexión al Pool siempre
  }
}

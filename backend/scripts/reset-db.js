// npm run db:reset
// Crea (o vuelve a crear) backend/cafeteria.db cargando ../../schema.sql
// con las tablas y los datos de ejemplo.
// No necesita instalar nada aparte: el archivo .db se crea solo.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { db, RUTA_BD } from '../src/db.js';

const rutaSchema = fileURLToPath(new URL('../../schema.sql', import.meta.url));

try {
  const sql = await readFile(rutaSchema, 'utf8');
  db.exec(sql); // exec permite varias sentencias seguidas (sin parámetros)
  db.close();
  console.log(`✔ schema.sql cargado en ${RUTA_BD}`);
  console.log('  Tablas y datos de ejemplo listos.');
} catch (error) {
  console.error('✘ No se pudo preparar la base de datos:', error.message);
  process.exit(1);
}

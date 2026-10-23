// npm run db:reset
// Crea la base de datos si no existe y carga ../../schema.sql
// (tablas + datos de ejemplo). Se puede correr cuantas veces haga falta.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cafeteria';
const rutaSchema = fileURLToPath(new URL('../../schema.sql', import.meta.url));

async function crearBaseSiNoExiste() {
  const destino = new URL(url);
  const nombreBD = decodeURIComponent(destino.pathname.slice(1));

  // CREATE DATABASE no acepta parámetros ($1), así que validamos el
  // nombre con una expresión regular antes de usarlo.
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombreBD)) {
    throw new Error(`Nombre de base de datos inválido: "${nombreBD}"`);
  }

  // Nos conectamos a la base "postgres" (siempre existe) para crear la nuestra
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombreBD]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${nombreBD}"`);
      console.log(`✔ Base de datos "${nombreBD}" creada`);
    }
  } finally {
    await client.end();
  }
  return nombreBD;
}

try {
  const nombreBD = await crearBaseSiNoExiste();
  const sql = await readFile(rutaSchema, 'utf8');
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log(`✔ schema.sql cargado en la base "${nombreBD}": tablas y datos de ejemplo listos`);
} catch (error) {
  console.error('✘ No se pudo preparar la base de datos:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('  ¿Está Docker encendido y PostgreSQL corriendo? Revisá DATABASE_URL en backend/.env');
  }
  if (error.code === '28P01') {
    console.error('  Usuario o contraseña incorrectos: revisá DATABASE_URL en backend/.env');
  }
  process.exit(1);
}

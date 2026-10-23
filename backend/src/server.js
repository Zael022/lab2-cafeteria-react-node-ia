import 'dotenv/config';
import app from './app.js';
import { pool } from './db.js';

const PORT = process.env.PORT || 3000;

// Probamos la conexión antes de abrir el puerto: si la base no responde
// o no tiene las tablas, es mejor enterarse ya que en la primera petición.
try {
  const { rows } = await pool.query("SELECT to_regclass('public.pedidos') AS tabla");
  if (!rows[0].tabla) {
    console.error('La base de datos no tiene las tablas. Corré: npm run db:reset');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`API de la cafetería en http://localhost:${PORT}/api`);
  });
} catch (error) {
  console.error('No se pudo conectar a PostgreSQL:', error.message);
  console.error('¿Está Docker encendido? En la raíz del proyecto corré: docker compose up -d');
  process.exit(1);
}

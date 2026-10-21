import 'dotenv/config';
import app from './app.js';
import { query, RUTA_BD } from './db.js';

const PORT = process.env.PORT || 3000;

// Revisamos que la base tenga las tablas antes de abrir el puerto:
// si falta correr el schema, es mejor enterarse ya.
const { rowCount } = query("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'pedidos'");
if (rowCount === 0) {
  console.error(`La base ${RUTA_BD} no tiene las tablas.`);
  console.error('Corré primero: npm run db:reset');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API de la cafetería en http://localhost:${PORT}/api`);
  console.log(`Base de datos: ${RUTA_BD}`);
});

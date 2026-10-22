// Todos los errores terminan aquí. Este es el ÚNICO lugar donde se
// decide el código HTTP de un error, así que todas las respuestas de
// error tienen el mismo formato: { error: "mensaje" }.

import { HttpError } from '../utils/httpError.js';

// Códigos de error de SQLite (err.errcode) que traducimos a algo útil.
// (Son una red de seguridad: los servicios ya validan antes.)
const ERRORES_BD = {
  787: [409, 'La operación viola una relación entre tablas (llave foránea)'], // SQLITE_CONSTRAINT_FOREIGNKEY
  2067: [409, 'Ya existe un registro con ese valor único'],                  // SQLITE_CONSTRAINT_UNIQUE
  275: [400, 'Un valor no cumple una restricción de la base de datos'],      // SQLITE_CONSTRAINT_CHECK
  1299: [400, 'Falta un valor obligatorio'],                                 // SQLITE_CONSTRAINT_NOTNULL
  5: [503, 'La base de datos está ocupada, intentá de nuevo'],               // SQLITE_BUSY
};

export function errorHandler(err, req, res, _next) {
  // 1. JSON mal formado en el body (lo detecta express.json()).
  //    Va primero porque también trae status 400, pero con un mensaje
  //    técnico en inglés que no queremos mostrar.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  // 2. Errores nuestros (HttpError) → ya traen su código
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // 3. Errores conocidos de SQLite
  if (err.errcode && ERRORES_BD[err.errcode]) {
    const [status, mensaje] = ERRORES_BD[err.errcode];
    return res.status(status).json({ error: mensaje });
  }

  // 4. Cualquier otra cosa es un error nuestro: lo registramos en consola
  //    pero NO le mostramos detalles internos al cliente.
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe` });
}

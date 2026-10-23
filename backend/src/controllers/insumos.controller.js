// Los controladores solo "traducen" HTTP ↔ servicio:
// leen req (params, query, body), llaman al servicio y responden.
// No hay reglas de negocio aquí.
//
// Son async porque PostgreSQL responde "más tarde" (por la red). En
// Express 5, si una función async lanza un error, Express lo manda solo
// al middleware de errores: no hace falta try/catch.
import * as servicio from '../services/insumos.service.js';
import * as validar from '../utils/validar.js';

export async function listar(req, res) {
  res.json(await servicio.listar(req.query));
}

export async function obtener(req, res) {
  res.json(await servicio.obtener(validar.id(req.params.id)));
}

export async function crear(req, res) {
  res.status(201).json(await servicio.crear(req.body));
}

export async function actualizar(req, res) {
  res.json(await servicio.actualizar(validar.id(req.params.id), req.body));
}

export async function eliminar(req, res) {
  await servicio.eliminar(validar.id(req.params.id));
  res.json({ mensaje: 'Insumo eliminado' });
}

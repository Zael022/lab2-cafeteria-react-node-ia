// Los controladores solo "traducen" HTTP ↔ servicio:
// leen req (params, query, body), llaman al servicio y responden.
// No hay reglas de negocio aquí.
//
// Si un servicio lanza un error (por ejemplo, un 404), Express lo manda
// solo al middleware de errores: no hace falta try/catch aquí.
// Son funciones normales (no async) porque node:sqlite es síncrono.
import * as servicio from '../services/insumos.service.js';
import * as validar from '../utils/validar.js';

export function listar(req, res) {
  res.json(servicio.listar(req.query));
}

export function obtener(req, res) {
  res.json(servicio.obtener(validar.id(req.params.id)));
}

export function crear(req, res) {
  res.status(201).json(servicio.crear(req.body));
}

export function actualizar(req, res) {
  res.json(servicio.actualizar(validar.id(req.params.id), req.body));
}

export function eliminar(req, res) {
  servicio.eliminar(validar.id(req.params.id));
  res.json({ mensaje: 'Insumo eliminado' });
}

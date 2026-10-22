import * as servicio from '../services/productos.service.js';
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
  res.json({ mensaje: 'Producto eliminado' });
}

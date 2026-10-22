import * as servicio from '../services/pedidos.service.js';
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

export function anular(req, res) {
  res.json(servicio.anular(validar.id(req.params.id)));
}

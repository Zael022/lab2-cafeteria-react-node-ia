import * as servicio from '../services/pedidos.service.js';
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

export async function anular(req, res) {
  res.json(await servicio.anular(validar.id(req.params.id)));
}

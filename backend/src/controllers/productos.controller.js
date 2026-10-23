import * as servicio from '../services/productos.service.js';
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
  res.json({ mensaje: 'Producto eliminado' });
}

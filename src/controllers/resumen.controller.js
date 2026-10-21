import * as servicio from '../services/resumen.service.js';

export function resumen(req, res) {
  res.json(servicio.resumen(req.query));
}

export function compras(req, res) {
  res.json(servicio.compras());
}

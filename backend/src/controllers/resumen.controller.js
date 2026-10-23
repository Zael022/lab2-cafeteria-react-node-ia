import * as servicio from '../services/resumen.service.js';

export async function resumen(req, res) {
  res.json(await servicio.resumen(req.query));
}

export async function compras(req, res) {
  res.json(await servicio.compras());
}

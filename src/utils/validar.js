// Funciones pequeñas de validación. Cada una devuelve el valor ya
// limpio (por ejemplo, el texto sin espacios) o lanza un 400.
import { badRequest } from './httpError.js';

/** Un id de la URL (/productos/:id) debe ser entero positivo. */
export function id(valor, nombre = 'id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`El ${nombre} debe ser un número entero positivo`);
  }
  return n;
}

/** Texto obligatorio y no vacío. */
export function texto(valor, campo) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw badRequest(`El campo "${campo}" es obligatorio`);
  }
  return valor.trim();
}

/** Número (acepta 0 si permiteCero). */
export function numero(valor, campo, { permiteCero = false } = {}) {
  const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw badRequest(`El campo "${campo}" debe ser un número`);
  }
  if (permiteCero ? n < 0 : n <= 0) {
    throw badRequest(`El campo "${campo}" debe ser ${permiteCero ? 'mayor o igual a 0' : 'mayor que 0'}`);
  }
  return n;
}

/** Entero positivo (por ejemplo, la cantidad de un item). */
export function entero(valor, campo) {
  if (!Number.isInteger(valor) || valor <= 0) {
    throw badRequest(`El campo "${campo}" debe ser un número entero mayor que 0`);
  }
  return valor;
}

/** Valor que debe estar en una lista de opciones. */
export function opcion(valor, campo, opciones) {
  if (!opciones.includes(valor)) {
    throw badRequest(`El campo "${campo}" debe ser uno de: ${opciones.join(', ')}`);
  }
  return valor;
}

/** Booleano estricto (true/false). */
export function booleano(valor, campo) {
  if (typeof valor !== 'boolean') {
    throw badRequest(`El campo "${campo}" debe ser true o false`);
  }
  return valor;
}

/** Booleano opcional en la query string (?activo=true). */
export function booleanoQuery(valor, campo) {
  if (valor === undefined || valor === '') return undefined;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  throw badRequest(`El parámetro "${campo}" debe ser true o false`);
}

/** Fecha opcional en formato AAAA-MM-DD. */
export function fechaQuery(valor, campo = 'fecha') {
  if (valor === undefined || valor === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw badRequest(`El parámetro "${campo}" debe tener el formato AAAA-MM-DD`);
  }
  return valor;
}

/** Redondea a 2 decimales (montos en colones con céntimos). */
export function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

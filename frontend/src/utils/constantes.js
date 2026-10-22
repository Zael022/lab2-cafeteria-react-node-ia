// Mismos valores que valida la API (backend/src/utils/constantes.js).
// El front los usa para armar los selects y validar antes de enviar,
// pero quien decide al final es siempre el servidor.

export const IMPUESTO = 0.13;
export const MINUTOS_PARA_ANULAR = 15;

export const CATEGORIAS = ['bebidas calientes', 'bebidas frías', 'panadería', 'snacks'];
export const UNIDADES = [
  { valor: 'g', texto: 'gramos (g)' },
  { valor: 'ml', texto: 'mililitros (ml)' },
  { valor: 'unidad', texto: 'unidades' },
];
export const METODOS_PAGO = ['efectivo', 'tarjeta', 'sinpe'];

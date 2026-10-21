// Valores fijos del negocio. Están en un solo lugar para que la API,
// la base de datos (CHECK en schema.sql) y el front digan lo mismo.

export const IMPUESTO = 0.13; // 13 % de IVA
export const MINUTOS_PARA_ANULAR = 15;

export const UNIDADES = ['g', 'ml', 'unidad'];
export const CATEGORIAS = ['bebidas calientes', 'bebidas frías', 'panadería', 'snacks'];
export const METODOS_PAGO = ['efectivo', 'tarjeta', 'sinpe'];
export const ESTADOS_PEDIDO = ['confirmado', 'anulado'];

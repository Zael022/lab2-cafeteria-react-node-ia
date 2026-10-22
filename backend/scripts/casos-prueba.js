// Lista de pruebas de la API. La usan dos scripts:
//   npm run probar  → las ejecuta contra la API y muestra ✔ / ✘
//   npm run postman → genera la colección para Postman / Thunder Client
//
// {{variable}} se reemplaza por un valor guardado en un paso anterior
// (por ejemplo, el id del insumo recién creado).
// Requisito: correr "npm run db:reset" antes, para partir de los datos de ejemplo.

export const casos = [
  // ------------------------------------------------------------ Insumos
  { carpeta: 'Insumos', nombre: 'Listar insumos', metodo: 'GET', ruta: '/insumos', esperado: 200 },
  { carpeta: 'Insumos', nombre: 'Insumos bajo mínimo, orden por stock', metodo: 'GET', ruta: '/insumos?bajo_minimo=true&orden=stock', esperado: 200 },
  { carpeta: 'Insumos', nombre: 'Detalle de insumo (con productos que lo usan)', metodo: 'GET', ruta: '/insumos/2', esperado: 200 },
  { carpeta: 'Insumos', nombre: '404 · Insumo inexistente', metodo: 'GET', ruta: '/insumos/9999', esperado: 404 },
  { carpeta: 'Insumos', nombre: '400 · Id no numérico', metodo: 'GET', ruta: '/insumos/abc', esperado: 400 },
  {
    carpeta: 'Insumos', nombre: 'Crear insumo', metodo: 'POST', ruta: '/insumos', esperado: 201,
    body: { nombre: 'Canela molida', unidad: 'g', stock: 200, stock_minimo: 50 },
    guardar: { insumoId: 'id' },
  },
  {
    carpeta: 'Insumos', nombre: '400 · Crear insumo sin nombre', metodo: 'POST', ruta: '/insumos', esperado: 400,
    body: { unidad: 'g', stock: 10 },
  },
  {
    carpeta: 'Insumos', nombre: '400 · Unidad inválida', metodo: 'POST', ruta: '/insumos', esperado: 400,
    body: { nombre: 'Agua', unidad: 'litros', stock: 10 },
  },
  {
    carpeta: 'Insumos', nombre: '400 · JSON mal formado', metodo: 'POST', ruta: '/insumos', esperado: 400,
    bodyRaw: '{ "nombre": "Sin cerrar" ',
  },
  {
    carpeta: 'Insumos', nombre: '409 · Nombre repetido', metodo: 'POST', ruta: '/insumos', esperado: 409,
    body: { nombre: 'Leche entera', unidad: 'ml', stock: 100 },
  },
  {
    carpeta: 'Insumos', nombre: 'Reabastecer insumo (PUT)', metodo: 'PUT', ruta: '/insumos/{{insumoId}}', esperado: 200,
    body: { nombre: 'Canela molida', unidad: 'g', stock: 500, stock_minimo: 50 },
  },
  { carpeta: 'Insumos', nombre: '409 · Eliminar insumo usado en recetas', metodo: 'DELETE', ruta: '/insumos/2', esperado: 409 },

  // ---------------------------------------------------------- Productos
  { carpeta: 'Productos', nombre: 'Listar productos (con disponibilidad)', metodo: 'GET', ruta: '/productos', esperado: 200 },
  {
    carpeta: 'Productos', nombre: 'Buscar + filtrar + ordenar', metodo: 'GET',
    ruta: '/productos?q=cro&categoria=panadería&orden=precio&dir=desc', esperado: 200,
  },
  { carpeta: 'Productos', nombre: 'Solo productos disponibles', metodo: 'GET', ruta: '/productos?disponible=true', esperado: 200 },
  { carpeta: 'Productos', nombre: 'Detalle con receta y ventas', metodo: 'GET', ruta: '/productos/3', esperado: 200 },
  { carpeta: 'Productos', nombre: '404 · Producto inexistente', metodo: 'GET', ruta: '/productos/9999', esperado: 404 },
  {
    carpeta: 'Productos', nombre: 'Crear producto con receta (transacción)', metodo: 'POST', ruta: '/productos', esperado: 201,
    body: {
      nombre: 'Capuchino de canela', precio: 2300, categoria: 'bebidas calientes',
      receta: [
        { insumo_id: 1, cantidad: 18 },
        { insumo_id: 2, cantidad: 150 },
        { insumo_id: 3, cantidad: 1 },
        { insumo_id: '{{insumoId}}', cantidad: 2 },
      ],
    },
    guardar: { productoId: 'id' },
  },
  {
    carpeta: 'Productos', nombre: '400 · Precio negativo', metodo: 'POST', ruta: '/productos', esperado: 400,
    body: { nombre: 'Gratis', precio: -5, categoria: 'snacks', receta: [{ insumo_id: 12, cantidad: 1 }] },
  },
  {
    carpeta: 'Productos', nombre: '400 · Sin receta', metodo: 'POST', ruta: '/productos', esperado: 400,
    body: { nombre: 'Aire', precio: 100, categoria: 'snacks', receta: [] },
  },
  {
    carpeta: 'Productos', nombre: '400 · Receta con insumo inexistente', metodo: 'POST', ruta: '/productos', esperado: 400,
    body: { nombre: 'Misterio', precio: 1000, categoria: 'snacks', receta: [{ insumo_id: 9999, cantidad: 1 }] },
  },
  {
    carpeta: 'Productos', nombre: 'Editar producto y receta (PUT)', metodo: 'PUT', ruta: '/productos/{{productoId}}', esperado: 200,
    body: {
      nombre: 'Capuchino de canela', precio: 2400, categoria: 'bebidas calientes', activo: true,
      receta: [
        { insumo_id: 1, cantidad: 18 },
        { insumo_id: 2, cantidad: 160 },
        { insumo_id: 3, cantidad: 1 },
        { insumo_id: '{{insumoId}}', cantidad: 3 },
      ],
    },
  },
  { carpeta: 'Productos', nombre: '409 · Eliminar producto con ventas', metodo: 'DELETE', ruta: '/productos/3', esperado: 409 },
  { carpeta: 'Productos', nombre: '409 · Eliminar insumo que ahora está en una receta', metodo: 'DELETE', ruta: '/insumos/{{insumoId}}', esperado: 409 },
  { carpeta: 'Productos', nombre: 'Eliminar producto sin ventas', metodo: 'DELETE', ruta: '/productos/{{productoId}}', esperado: 200 },
  { carpeta: 'Productos', nombre: 'Eliminar insumo ya libre', metodo: 'DELETE', ruta: '/insumos/{{insumoId}}', esperado: 200 },
  { carpeta: 'Productos', nombre: '404 · Eliminar insumo ya eliminado', metodo: 'DELETE', ruta: '/insumos/{{insumoId}}', esperado: 404 },

  // ------------------------------------------------------------ Pedidos
  { carpeta: 'Pedidos', nombre: 'Listar pedidos', metodo: 'GET', ruta: '/pedidos', esperado: 200 },
  { carpeta: 'Pedidos', nombre: 'Filtrar pedidos anulados', metodo: 'GET', ruta: '/pedidos?estado=anulado', esperado: 200 },
  { carpeta: 'Pedidos', nombre: 'Detalle de pedido con items', metodo: 'GET', ruta: '/pedidos/1', esperado: 200 },
  {
    carpeta: 'Pedidos', nombre: 'Crear pedido (descuenta insumos)', metodo: 'POST', ruta: '/pedidos', esperado: 201,
    body: { metodo_pago: 'sinpe', items: [{ producto_id: 3, cantidad: 2 }, { producto_id: 9, cantidad: 1 }] },
    guardar: { pedidoId: 'id' },
  },
  {
    carpeta: 'Pedidos', nombre: '400 · Método de pago inválido', metodo: 'POST', ruta: '/pedidos', esperado: 400,
    body: { metodo_pago: 'bitcoin', items: [{ producto_id: 1, cantidad: 1 }] },
  },
  {
    carpeta: 'Pedidos', nombre: '400 · Pedido sin items', metodo: 'POST', ruta: '/pedidos', esperado: 400,
    body: { metodo_pago: 'efectivo', items: [] },
  },
  {
    carpeta: 'Pedidos', nombre: '400 · Cantidad 0', metodo: 'POST', ruta: '/pedidos', esperado: 400,
    body: { metodo_pago: 'efectivo', items: [{ producto_id: 1, cantidad: 0 }] },
  },
  {
    carpeta: 'Pedidos', nombre: '409 · Insumos insuficientes (200 capuchinos)', metodo: 'POST', ruta: '/pedidos', esperado: 409,
    body: { metodo_pago: 'tarjeta', items: [{ producto_id: 3, cantidad: 200 }] },
  },
  {
    carpeta: 'Pedidos', nombre: '409 · Producto inactivo (Mocaccino)', metodo: 'POST', ruta: '/pedidos', esperado: 409,
    body: { metodo_pago: 'tarjeta', items: [{ producto_id: 12, cantidad: 1 }] },
  },
  { carpeta: 'Pedidos', nombre: 'Anular pedido recién creado (devuelve insumos)', metodo: 'PATCH', ruta: '/pedidos/{{pedidoId}}/anular', esperado: 200 },
  { carpeta: 'Pedidos', nombre: '409 · Anular un pedido ya anulado', metodo: 'PATCH', ruta: '/pedidos/{{pedidoId}}/anular', esperado: 409 },
  { carpeta: 'Pedidos', nombre: '409 · Anular después de 15 minutos', metodo: 'PATCH', ruta: '/pedidos/1/anular', esperado: 409 },
  { carpeta: 'Pedidos', nombre: '404 · Anular pedido inexistente', metodo: 'PATCH', ruta: '/pedidos/9999/anular', esperado: 404 },

  // ------------------------------------------------------------ Resumen
  { carpeta: 'Resumen', nombre: 'Cierre de caja de hoy', metodo: 'GET', ruta: '/resumen', esperado: 200 },
  { carpeta: 'Resumen', nombre: '400 · Fecha inválida', metodo: 'GET', ruta: '/resumen?fecha=2026-13-45', esperado: 400 },
  { carpeta: 'Resumen', nombre: 'Datos para el agente de compras', metodo: 'GET', ruta: '/resumen/compras', esperado: 200 },
  { carpeta: 'Resumen', nombre: '404 · Ruta inexistente', metodo: 'GET', ruta: '/no-existe', esperado: 404 },
];

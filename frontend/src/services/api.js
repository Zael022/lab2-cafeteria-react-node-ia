// TODA la comunicación con el servidor pasa por este archivo.
// Los componentes nunca usan fetch directamente: llaman a estas funciones.
// Si mañana cambia una ruta de la API, se corrige solo aquí.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const N8N_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/sugerencia-compra';

/**
 * Error que conserva el código HTTP (400, 404, 409...) para que la
 * vista pueda decidir qué mostrar.
 */
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

/** Arma "?q=cafe&orden=precio" ignorando los valores vacíos. */
function aQueryString(params = {}) {
  const limpios = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return limpios.length ? `?${new URLSearchParams(limpios)}` : '';
}

/**
 * Hace la petición y devuelve el JSON.
 * Si la API responde con error, lanza ApiError con el mensaje de { error }.
 */
async function peticion(ruta, { metodo = 'GET', datos } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: datos ? { 'Content-Type': 'application/json' } : undefined,
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch {
    // fetch solo falla así cuando no hay conexión con el servidor
    throw new ApiError(
      'No hay conexión con la API. Revisá que el backend esté corriendo (npm run dev en la carpeta backend).',
      0
    );
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ApiError(cuerpo?.error || `Error ${respuesta.status}`, respuesta.status);
  }
  return cuerpo;
}

// ------------------------------------------------------------ Resumen
export const getResumen = (fecha) => peticion(`/resumen${aQueryString({ fecha })}`);
// Los mismos datos que consulta el agente de IA (insumos + consumo de la semana)
export const getDatosCompras = () => peticion('/resumen/compras');

// ---------------------------------------------------------- Productos
export const getProductos = (filtros) => peticion(`/productos${aQueryString(filtros)}`);
export const getProducto = (id) => peticion(`/productos/${id}`);
export const crearProducto = (datos) => peticion('/productos', { metodo: 'POST', datos });
export const actualizarProducto = (id, datos) =>
  peticion(`/productos/${id}`, { metodo: 'PUT', datos });
export const eliminarProducto = (id) => peticion(`/productos/${id}`, { metodo: 'DELETE' });

// ------------------------------------------------------------ Insumos
export const getInsumos = (filtros) => peticion(`/insumos${aQueryString(filtros)}`);
export const getInsumo = (id) => peticion(`/insumos/${id}`);
export const crearInsumo = (datos) => peticion('/insumos', { metodo: 'POST', datos });
export const actualizarInsumo = (id, datos) => peticion(`/insumos/${id}`, { metodo: 'PUT', datos });
export const eliminarInsumo = (id) => peticion(`/insumos/${id}`, { metodo: 'DELETE' });

// ------------------------------------------------------------ Pedidos
export const getPedidos = (filtros) => peticion(`/pedidos${aQueryString(filtros)}`);
export const getPedido = (id) => peticion(`/pedidos/${id}`);
export const crearPedido = (datos) => peticion('/pedidos', { metodo: 'POST', datos });
export const anularPedido = (id) => peticion(`/pedidos/${id}/anular`, { metodo: 'PATCH' });

// -------------------------------------------- Agente de IA (n8n)
/**
 * Llama al webhook de n8n. El workflow responde siempre con el
 * contrato { ok, data, error }.
 *   ok: true  → data = { resumen, compras: [{ insumo, cantidad, unidad, prioridad, justificacion }] }
 *   ok: false → error = "mensaje"
 */
export async function pedirSugerenciaCompra({ diasACubrir, nota }) {
  let respuesta;
  try {
    respuesta = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dias_a_cubrir: diasACubrir, nota }),
    });
  } catch {
    throw new ApiError(
      'No hay conexión con n8n. Revisá que n8n esté corriendo (npx n8n) y que el workflow esté activo.',
      0
    );
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!cuerpo || typeof cuerpo.ok !== 'boolean') {
    throw new ApiError('n8n respondió en un formato inesperado (se esperaba { ok, data, error }).', respuesta.status);
  }
  if (!cuerpo.ok) {
    throw new ApiError(cuerpo.error || 'El asistente no pudo generar la sugerencia.', respuesta.status);
  }
  return cuerpo.data;
}

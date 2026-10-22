// Listado de productos con búsqueda, filtros y orden.
// Los filtros se mandan a la API (GET /api/productos?q=...&orden=...).
import { Link } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import { Buscador, Campo } from '../components/Piezas.jsx';
import ListaProductos from '../components/ListaProductos.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useFiltrosURL } from '../hooks/useFiltrosURL.js';
import { getProductos } from '../services/api.js';
import { CATEGORIAS } from '../utils/constantes.js';

// Cada opción de "Mostrar" se traduce a los parámetros que entiende la API
const ESTADOS = {
  todos: {},
  disponibles: { disponible: true },
  agotados: { activo: true, disponible: false },
  inactivos: { activo: false },
};

// "precio-desc" → orden=precio, dir=desc
const ORDENES = [
  { valor: 'nombre-asc', texto: 'Nombre (A-Z)' },
  { valor: 'precio-asc', texto: 'Precio: menor a mayor' },
  { valor: 'precio-desc', texto: 'Precio: mayor a menor' },
  { valor: 'porciones-asc', texto: 'Por agotarse primero' },
];

export default function Productos() {
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltrosURL({
    q: '',
    categoria: '',
    estado: 'todos',
    orden: 'nombre-asc',
  });

  const [orden, dir] = filtros.orden.split('-');
  const { datos, cargando, error, recargar } = useFetch(
    () => getProductos({ q: filtros.q, categoria: filtros.categoria, orden, dir, ...(ESTADOS[filtros.estado] ?? {}) }),
    [filtros.q, filtros.categoria, filtros.estado, filtros.orden]
  );

  return (
    <>
      <Encabezado
        migas={[{ texto: 'Inventario' }, { texto: 'Productos' }]}
        titulo="Productos"
        descripcion="Lo que se vende en el mostrador. La disponibilidad se calcula con la receta y el stock de insumos."
      >
        <Link to="/productos/nuevo" className="boton boton--primario">
          Nuevo producto
        </Link>
      </Encabezado>

      <div className="filtros">
        <Buscador valor={filtros.q} onCambiar={(v) => cambiarFiltro('q', v)} placeholder="Ej. capuchino" />
        <Campo etiqueta="Categoría">
          <select value={filtros.categoria} onChange={(e) => cambiarFiltro('categoria', e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Mostrar">
          <select value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
            <option value="todos">Todos</option>
            <option value="disponibles">Disponibles para vender</option>
            <option value="agotados">Agotados (faltan insumos)</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </Campo>
        <Campo etiqueta="Ordenar por">
          <select value={filtros.orden} onChange={(e) => cambiarFiltro('orden', e.target.value)}>
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </Campo>
        {hayFiltros && (
          <button type="button" className="boton boton--texto" onClick={limpiarFiltros}>
            Quitar filtros
          </button>
        )}
      </div>

      {cargando && !datos && <Cargando />}
      <MensajeError error={error} onReintentar={recargar} />

      {datos && (
        <>
          <p className="resumen-listado" aria-live="polite">
            {datos.length} {datos.length === 1 ? 'producto' : 'productos'}
          </p>
          {datos.length === 0 ? (
            <Vacio titulo={hayFiltros ? 'Ningún producto coincide con los filtros' : 'Todavía no hay productos'}>
              {hayFiltros ? (
                <button type="button" className="boton boton--secundario boton--chico" onClick={limpiarFiltros}>Quitar filtros</button>
              ) : (
                <Link to="/productos/nuevo" className="boton boton--secundario boton--chico">Crear el primero</Link>
              )}
            </Vacio>
          ) : (
            <div className={cargando ? 'actualizando' : ''}>
              <ListaProductos productos={datos} />
            </div>
          )}
        </>
      )}
    </>
  );
}

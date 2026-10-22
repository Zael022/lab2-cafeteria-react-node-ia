// Listado de insumos con búsqueda, filtro "bajo el mínimo" y orden.
import { Link } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import { Buscador, Campo } from '../components/Piezas.jsx';
import ListaInsumos from '../components/ListaInsumos.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useFiltrosURL } from '../hooks/useFiltrosURL.js';
import { getInsumos } from '../services/api.js';

const ORDENES = [
  { valor: 'nombre-asc', texto: 'Nombre (A-Z)' },
  { valor: 'faltante-asc', texto: 'Más urgentes primero' },
  { valor: 'stock-desc', texto: 'Mayor stock' },
];

export default function Insumos() {
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltrosURL({
    q: '',
    bajo_minimo: '',
    orden: 'nombre-asc',
  });
  const [orden, dir] = filtros.orden.split('-');
  const { datos, cargando, error, recargar } = useFetch(
    () => getInsumos({ q: filtros.q, bajo_minimo: filtros.bajo_minimo, orden, dir }),
    [filtros.q, filtros.bajo_minimo, filtros.orden]
  );

  const bajos = datos?.filter((i) => i.bajo_minimo).length ?? 0;

  return (
    <>
      <Encabezado
        migas={[{ texto: 'Inventario' }, { texto: 'Insumos' }]}
        titulo="Insumos"
        descripcion="La materia prima. Cada venta descuenta lo que indica la receta de cada producto."
      >
        <Link to="/asistente" className="boton boton--secundario">
          Pedir sugerencia de compra
        </Link>
        <Link to="/insumos/nuevo" className="boton boton--primario">
          Nuevo insumo
        </Link>
      </Encabezado>

      <div className="filtros">
        <Buscador valor={filtros.q} onCambiar={(v) => cambiarFiltro('q', v)} placeholder="Ej. leche" />
        <Campo etiqueta="Mostrar">
          <select value={filtros.bajo_minimo} onChange={(e) => cambiarFiltro('bajo_minimo', e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Solo bajo el mínimo</option>
            <option value="false">Solo suficientes</option>
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
            {datos.length} {datos.length === 1 ? 'insumo' : 'insumos'}
            {bajos > 0 && ` · ${bajos} bajo el mínimo`}
          </p>
          {datos.length === 0 ? (
            <Vacio titulo={hayFiltros ? 'Ningún insumo coincide con los filtros' : 'Todavía no hay insumos'}>
              {hayFiltros ? (
                <button type="button" className="boton boton--secundario boton--chico" onClick={limpiarFiltros}>Quitar filtros</button>
              ) : (
                <Link to="/insumos/nuevo" className="boton boton--secundario boton--chico">Crear el primero</Link>
              )}
            </Vacio>
          ) : (
            <div className={cargando ? 'actualizando' : ''}>
              <ListaInsumos insumos={datos} />
            </div>
          )}
        </>
      )}
    </>
  );
}

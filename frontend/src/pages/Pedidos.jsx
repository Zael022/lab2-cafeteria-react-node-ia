// Listado de pedidos con filtros por día, estado y forma de pago.
import { Link } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import { Campo, Insignia } from '../components/Piezas.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useFiltrosURL } from '../hooks/useFiltrosURL.js';
import { getPedidos } from '../services/api.js';
import { METODOS_PAGO } from '../utils/constantes.js';
import { colones, fechaHora, hoyISO, nombreMetodo } from '../utils/formato.js';

const ORDENES = {
  recientes: (a, b) => b.fecha.localeCompare(a.fecha),
  antiguos: (a, b) => a.fecha.localeCompare(b.fecha),
  mayor: (a, b) => b.total - a.total,
};

export default function Pedidos() {
  const { filtros, cambiarFiltro, limpiarFiltros, hayFiltros } = useFiltrosURL({
    fecha: '',
    estado: '',
    metodo_pago: '',
    orden: 'recientes',
  });
  const { datos, cargando, error, recargar } = useFetch(
    () => getPedidos({ fecha: filtros.fecha, estado: filtros.estado, metodo_pago: filtros.metodo_pago }),
    [filtros.fecha, filtros.estado, filtros.metodo_pago]
  );

  // El orden se aplica aquí en el front porque la lista ya está completa
  const pedidos = datos ? [...datos].sort(ORDENES[filtros.orden] ?? ORDENES.recientes) : [];
  const totalListado = pedidos.filter((p) => p.estado === 'confirmado').reduce((s, p) => s + p.total, 0);

  return (
    <>
      <Encabezado migas={[{ texto: 'Mostrador' }, { texto: 'Pedidos' }]} titulo="Pedidos" descripcion="Todas las ventas registradas. Abrí una para ver su detalle o anularla.">
        <Link to="/venta" className="boton boton--primario">
          Nueva venta
        </Link>
      </Encabezado>

      <div className="filtros">
        <Campo etiqueta="Día">
          <input type="date" value={filtros.fecha} max={hoyISO()} onChange={(e) => cambiarFiltro('fecha', e.target.value)} />
        </Campo>
        <Campo etiqueta="Estado">
          <select value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
            <option value="">Todos</option>
            <option value="confirmado">Cobrados</option>
            <option value="anulado">Anulados</option>
          </select>
        </Campo>
        <Campo etiqueta="Forma de pago">
          <select value={filtros.metodo_pago} onChange={(e) => cambiarFiltro('metodo_pago', e.target.value)}>
            <option value="">Todas</option>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {nombreMetodo[m]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Ordenar por">
          <select value={filtros.orden} onChange={(e) => cambiarFiltro('orden', e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="mayor">Mayor total</option>
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
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} · {colones(totalListado)} cobrados
          </p>
          {pedidos.length === 0 ? (
            <Vacio titulo="No hay pedidos con esos filtros">{hayFiltros && <button type="button" className="boton boton--secundario boton--chico" onClick={limpiarFiltros}>Quitar filtros</button>}</Vacio>
          ) : (
            <div className={`tabla ${cargando ? 'actualizando' : ''}`}>
              <div className="fila fila--cabecera fila--pedido" aria-hidden="true">
                <span>Pedido</span>
                <span>Forma de pago</span>
                <span>Estado</span>
                <span className="fila__dato--numero">Total</span>
              </div>
              <ul>
                {pedidos.map((p) => (
                  <li key={p.id} className="fila fila--pedido">
                    <Link to={`/pedidos/${p.id}`} className="fila__principal">
                      <strong>Pedido #{p.id}</strong>
                      <span className="tenue">
                        {fechaHora(p.fecha)} · {p.unidades} {p.unidades === 1 ? 'artículo' : 'artículos'}
                      </span>
                    </Link>
                    <span className="fila__dato">{nombreMetodo[p.metodo_pago]}</span>
                    <span className="fila__dato">{p.estado === 'confirmado' ? <Insignia tono="ok">Cobrado</Insignia> : <Insignia tono="neutro">Anulado</Insignia>}</span>
                    <span className={`fila__dato fila__dato--numero ${p.estado === 'anulado' ? 'tachado' : ''}`}>{colones(p.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}

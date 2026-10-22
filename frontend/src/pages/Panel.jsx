// Panel del día (la pantalla de inicio): consume GET /api/resumen.
// Arriba, la portada con los indicadores en paneles de vidrio; abajo,
// el cierre de caja, lo más vendido, la semana y cómo funciona el mostrador.
import { Link } from 'react-router-dom';
import Portada, { Vidrio } from '../components/Portada.jsx';
import GraficoBarras from '../components/GraficoBarras.jsx';
import ListaChecks from '../components/ListaChecks.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useFiltrosURL } from '../hooks/useFiltrosURL.js';
import { getResumen } from '../services/api.js';
import { colones, diaCorto, fechaLarga, hoyISO, nombreMetodo } from '../utils/formato.js';

// Las reglas del negocio, explicadas en una línea cada una
const COMO_FUNCIONA = [
  { titulo: 'Cada venta descuenta insumos', texto: 'Según la receta de cada producto, en una sola operación.' },
  { titulo: 'IVA de 13 % automático', texto: 'El total lo calcula el sistema, no la persona que cobra.' },
  { titulo: 'Anular en 15 minutos', texto: 'Después ya no se puede, y al anular vuelve el inventario.' },
  { titulo: 'Aviso de stock mínimo', texto: 'Si un insumo baja del mínimo, aparece arriba para comprarlo.' },
];

export default function Panel() {
  const hoy = hoyISO();
  const { filtros, cambiarFiltro } = useFiltrosURL({ fecha: hoy });
  const { datos, cargando, error, recargar } = useFetch(() => getResumen(filtros.fecha), [filtros.fecha]);

  const esHoy = filtros.fecha === hoy;
  // Cuántos pedidos del día se anularon (viene en pedidos_por_estado)
  const anulados = datos?.pedidos_por_estado.find((e) => e.estado === 'anulado')?.pedidos ?? 0;
  const maximoSemana = Math.max(...(datos?.ventas_ultimos_7_dias.map((d) => d.total) ?? [0]), 1);

  return (
    <>
      <Portada
        migas={[{ texto: 'Negocio' }, { texto: 'Panel del día' }]}
        antetitulo={fechaLarga(filtros.fecha)}
        titulo={esHoy ? 'Así va el día' : 'Cierre de ese día'}
        descripcion="Solo cuentan las ventas cobradas; las anuladas no suman."
      >
        <div className="portada__indicadores">
          <Vidrio className="indicador">
            <span className="indicador__etiqueta">Vendido</span>
            <strong className="indicador__valor">{datos ? colones(datos.total) : '…'}</strong>
            {datos && <span className="indicador__detalle">{colones(datos.subtotal)} + {colones(datos.impuesto)} de IVA</span>}
          </Vidrio>
          <Vidrio as={Link} to={`/pedidos?fecha=${filtros.fecha}`} className="indicador indicador--enlace">
            <span className="indicador__etiqueta">Pedidos cobrados</span>
            <strong className="indicador__valor">{datos ? datos.pedidos : '…'}</strong>
            {datos && (
              <span className="indicador__detalle">
                Tiquete promedio {colones(datos.ticket_promedio)}
                {anulados > 0 && ` · ${anulados} ${anulados === 1 ? 'anulado' : 'anulados'}`}
              </span>
            )}
          </Vidrio>
          <Vidrio
            as={Link}
            to="/insumos?bajo_minimo=true"
            className={`indicador indicador--enlace ${datos?.insumos_bajo_minimo > 0 ? 'indicador--alerta' : ''}`}
          >
            <span className="indicador__etiqueta">Insumos por comprar</span>
            <strong className="indicador__valor">{datos ? datos.insumos_bajo_minimo : '…'}</strong>
            {datos && (
              <span className="indicador__detalle">
                {datos.insumos_bajo_minimo > 0 ? 'Están bajo el mínimo. Ver cuáles' : 'Todo por encima del mínimo'}
              </span>
            )}
          </Vidrio>
        </div>

        <Vidrio className="portada__acciones">
          <div className="portada__dia">
            <label htmlFor="dia-panel">Ver otro día</label>
            <input id="dia-panel" type="date" value={filtros.fecha} max={hoy} onChange={(e) => cambiarFiltro('fecha', e.target.value || hoy)} />
          </div>
          <Link to="/venta" className="boton boton--claro">
            Nueva venta
          </Link>
        </Vidrio>
      </Portada>

      {cargando && !datos && <Cargando />}
      <MensajeError error={error} onReintentar={recargar} />

      {datos && (
        <div className={`panel ${cargando ? 'actualizando' : ''}`}>
          <section className="cifras" aria-labelledby="titulo-caja">
            <p className="cifras__antetitulo">Cierre de caja</p>
            <h2 id="titulo-caja">Por forma de pago</h2>
            {datos.pedidos === 0 ? (
              <p className="cifras__vacio">
                Sin ventas este día.{' '}
                {esHoy && <Link to="/venta">Registrar la primera venta</Link>}
              </p>
            ) : (
              <ul className="cifras__tiles">
                {datos.por_metodo_pago.map((m) => (
                  <li key={m.metodo_pago}>
                    <Link to={`/pedidos?fecha=${filtros.fecha}&metodo_pago=${m.metodo_pago}`} className="cifra">
                      <strong className="cifra__valor">{colones(m.total)}</strong>
                      <span className="cifra__etiqueta">
                        {nombreMetodo[m.metodo_pago]} · {m.pedidos} {m.pedidos === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bloque bloque--top">
            <h2>Lo más vendido</h2>
            {datos.top_productos.length === 0 ? (
              <Vacio titulo="Todavía no hay productos vendidos este día" />
            ) : (
              <GraficoBarras
                descripcion="Los 5 productos más vendidos, en unidades"
                datos={datos.top_productos.map((p) => ({
                  clave: p.producto_id,
                  etiqueta: p.nombre,
                  valor: p.unidades,
                  texto: `${p.unidades} u · ${colones(p.vendido)}`,
                  enlace: `/productos/${p.producto_id}`,
                }))}
              />
            )}
          </section>

          <section className="linea-tiempo" aria-labelledby="titulo-semana">
            <div className="linea-tiempo__intro">
              <h2 id="titulo-semana">Últimos 7 días</h2>
              <p>Elegí un día para ver su cierre de caja arriba.</p>
            </div>
            <ul className="linea-tiempo__dias">
              {datos.ventas_ultimos_7_dias.map((d) => {
                const elegido = d.fecha === filtros.fecha;
                return (
                  <li key={d.fecha}>
                    <button
                      type="button"
                      className={`dia ${elegido ? 'dia--elegido' : ''}`}
                      onClick={() => cambiarFiltro('fecha', d.fecha)}
                      aria-pressed={elegido}
                    >
                      <span className="dia__nombre">{diaCorto(d.fecha)}</span>
                      <span className="dia__pista" aria-hidden="true">
                        <span className="dia__barra" style={{ width: `${Math.max((d.total / maximoSemana) * 100, d.total > 0 ? 2 : 0)}%` }} />
                      </span>
                      <span className="dia__total">{colones(d.total)}</span>
                      <span className="dia__pedidos">
                        {d.pedidos} {d.pedidos === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      <svg className="dia__flecha" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="como-funciona" aria-labelledby="titulo-como">
            <h2 id="titulo-como">Así funciona el mostrador</h2>
            <ListaChecks puntos={COMO_FUNCIONA} columnas />
          </section>
        </div>
      )}
    </>
  );
}

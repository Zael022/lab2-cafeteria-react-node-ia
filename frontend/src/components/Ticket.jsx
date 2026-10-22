// El "tiquete" de la venta: lo que se va a cobrar.
// Muestra un total ESTIMADO; el total oficial lo calcula el servidor
// al confirmar (el front nunca manda precios ni totales).
import { Link } from 'react-router-dom';
import { IMPUESTO, METODOS_PAGO } from '../utils/constantes.js';
import { colones, hora, nombreMetodo } from '../utils/formato.js';
import { MensajeError } from './Estados.jsx';
import { IconoMas, IconoMenos, IconoBasura } from './Iconos.jsx';

export default function Ticket({
  lineas,
  metodo,
  onCambiarCantidad,
  onQuitar,
  onMetodo,
  onCobrar,
  cobrando,
  error,
  pedido, // el pedido ya cobrado (respuesta 201 de la API)
  onNuevaVenta,
}) {
  // ---------------------------------------------------- Venta cobrada
  if (pedido) {
    return (
      <section className="ticket ticket--cobrado" aria-labelledby="ticket-titulo">
        <h2 id="ticket-titulo">Pedido #{pedido.id} cobrado</h2>
        <p className="tenue">
          {hora(pedido.fecha)} · {nombreMetodo[pedido.metodo_pago]}
        </p>
        <ul className="ticket__lineas">
          {pedido.items.map((it) => (
            <li key={it.id}>
              <span>
                {it.cantidad} × {it.nombre}
              </span>
              <span>{colones(it.importe)}</span>
            </li>
          ))}
        </ul>
        <dl className="ticket__totales">
          <div><dt>Subtotal</dt><dd>{colones(pedido.subtotal)}</dd></div>
          <div><dt>IVA 13 %</dt><dd>{colones(pedido.impuesto)}</dd></div>
          <div className="ticket__total"><dt>Total</dt><dd>{colones(pedido.total)}</dd></div>
        </dl>
        <p className="ticket__nota">
          Los insumos ya se descontaron. Podés anularlo durante {pedido.minutos_para_anular} minutos desde su detalle.
        </p>
        <div className="ticket__acciones">
          <button type="button" className="boton boton--primario" onClick={onNuevaVenta}>
            Empezar otra venta
          </button>
          <Link to={`/pedidos/${pedido.id}`} className="boton boton--secundario">
            Ver pedido #{pedido.id}
          </Link>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------- Venta en curso
  const subtotal = lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);
  const impuesto = Math.round(subtotal * IMPUESTO * 100) / 100;
  const total = subtotal + impuesto;
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);

  let pendiente = null;
  if (lineas.length === 0) pendiente = 'Tocá un producto de la izquierda para agregarlo.';
  else if (!metodo) pendiente = 'Elegí cómo paga el cliente.';

  return (
    <section className="ticket" aria-labelledby="ticket-titulo">
      <h2 id="ticket-titulo">
        Tiquete {unidades > 0 && <span className="tenue">({unidades} {unidades === 1 ? 'artículo' : 'artículos'})</span>}
      </h2>

      {lineas.length === 0 ? (
        <p className="ticket__vacio">Todavía no hay nada en el tiquete.</p>
      ) : (
        <ul className="ticket__lineas ticket__lineas--editables">
          {lineas.map(({ producto, cantidad }) => (
            <li key={producto.id}>
              <div className="ticket__producto">
                <strong>{producto.nombre}</strong>
                <span className="tenue">{colones(producto.precio)} c/u</span>
              </div>
              <div className="contador" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
                <button type="button" className="boton-icono" onClick={() => onCambiarCantidad(producto.id, cantidad - 1)} aria-label="Uno menos">
                  {cantidad === 1 ? <IconoBasura /> : <IconoMenos />}
                </button>
                <output aria-live="polite">{cantidad}</output>
                <button
                  type="button"
                  className="boton-icono"
                  onClick={() => onCambiarCantidad(producto.id, cantidad + 1)}
                  disabled={cantidad >= producto.porciones_disponibles}
                  aria-label="Uno más"
                  title={cantidad >= producto.porciones_disponibles ? `Solo alcanza para ${producto.porciones_disponibles}` : undefined}
                >
                  <IconoMas />
                </button>
              </div>
              <span className="ticket__importe">{colones(producto.precio * cantidad)}</span>
              <button type="button" className="enlace-quitar" onClick={() => onQuitar(producto.id)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <dl className="ticket__totales">
        <div><dt>Subtotal</dt><dd>{colones(subtotal)}</dd></div>
        <div><dt>IVA 13 %</dt><dd>{colones(impuesto)}</dd></div>
        <div className="ticket__total"><dt>Total</dt><dd>{colones(total)}</dd></div>
      </dl>

      <fieldset className="metodos">
        <legend>Forma de pago</legend>
        <div className="metodos__opciones">
          {METODOS_PAGO.map((m) => (
            <label key={m} className={`metodo ${metodo === m ? 'metodo--elegido' : ''}`}>
              <input type="radio" name="metodo" value={m} checked={metodo === m} onChange={() => onMetodo(m)} />
              {nombreMetodo[m]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 409 de la API: por ejemplo, dos productos que juntos agotan un insumo */}
      <MensajeError error={error} />

      <button type="button" className="boton boton--primario boton--grande" onClick={onCobrar} disabled={!!pendiente || cobrando}>
        {cobrando ? 'Cobrando…' : `Cobrar ${colones(total)}`}
      </button>
      {pendiente && <p className="ticket__pendiente">{pendiente}</p>}
    </section>
  );
}

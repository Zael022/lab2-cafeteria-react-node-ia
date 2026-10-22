// Detalle de un pedido: sus productos (datos relacionados) y la
// opción de anularlo durante los primeros 15 minutos.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import DialogoConfirmar from '../components/DialogoConfirmar.jsx';
import { Insignia } from '../components/Piezas.jsx';
import { Cargando, MensajeError } from '../components/Estados.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { anularPedido, getPedido } from '../services/api.js';
import { MINUTOS_PARA_ANULAR } from '../utils/constantes.js';
import { colones, fechaHora, nombreMetodo } from '../utils/formato.js';

export default function PedidoDetalle() {
  const { id } = useParams();
  const { avisar } = useAvisos();
  const { datos: pedido, cargando, error, recargar } = useFetch(() => getPedido(id), [id]);
  const [confirmando, setConfirmando] = useState(false);

  // Mientras se pueda anular, refrescamos cada 30 s para que el
  // contador de minutos baje solo.
  useEffect(() => {
    if (!pedido?.se_puede_anular) return;
    const intervalo = setInterval(recargar, 30_000);
    return () => clearInterval(intervalo);
  }, [pedido?.se_puede_anular, recargar]);

  async function anular() {
    await anularPedido(id); // si responde 409, el diálogo muestra el error
    setConfirmando(false);
    avisar(`Pedido #${id} anulado. Los insumos volvieron al inventario.`, { enlace: '/insumos', textoEnlace: 'Ver insumos' });
    recargar();
  }

  const migas = [{ texto: 'Mostrador' }, { texto: 'Pedidos', a: '/pedidos' }, { texto: `#${id}` }];

  if (cargando && !pedido) return <><Encabezado migas={migas} titulo={`Pedido #${id}`} /><Cargando /></>;
  if (error)
    return (
      <>
        <Encabezado migas={migas} titulo={`Pedido #${id}`} />
        <MensajeError error={error}>
          <Link to="/pedidos" className="boton boton--secundario boton--chico">Volver a pedidos</Link>
        </MensajeError>
      </>
    );

  const anulado = pedido.estado === 'anulado';

  return (
    <>
      <Encabezado migas={migas} titulo={`Pedido #${pedido.id}`} descripcion={`${fechaHora(pedido.fecha)} · ${nombreMetodo[pedido.metodo_pago]}`}>
        {anulado ? <Insignia tono="neutro">Anulado</Insignia> : <Insignia tono="ok">Cobrado</Insignia>}
      </Encabezado>

      <div className="detalle">
        <section className="bloque">
          <h2>Productos</h2>
          <ul className="lineas">
            {pedido.items.map((it) => (
              <li key={it.id}>
                <span>
                  {it.cantidad} × <Link to={`/productos/${it.producto_id}`}>{it.nombre}</Link>
                  <span className="tenue"> a {colones(it.precio_unitario)}</span>
                </span>
                <strong>{colones(it.importe)}</strong>
              </li>
            ))}
          </ul>
          <dl className="totales">
            <div><dt>Subtotal</dt><dd>{colones(pedido.subtotal)}</dd></div>
            <div><dt>IVA 13 %</dt><dd>{colones(pedido.impuesto)}</dd></div>
            <div className="totales__total"><dt>Total</dt><dd className={anulado ? 'tachado' : ''}>{colones(pedido.total)}</dd></div>
          </dl>
          <p className="tenue">El precio de cada producto quedó guardado al momento de la venta, aunque luego cambie.</p>
        </section>

        <aside className="bloque bloque--lateral">
          <h2>Anular</h2>
          {anulado && <p>Este pedido se anuló el {fechaHora(pedido.fecha_anulacion)} y sus insumos se devolvieron al inventario.</p>}
          {!anulado && pedido.se_puede_anular && (
            <>
              <p>
                Quedan <strong>{pedido.minutos_para_anular} {pedido.minutos_para_anular === 1 ? 'minuto' : 'minutos'}</strong> para anularlo. Al anularlo, los insumos vuelven al inventario.
              </p>
              <button type="button" className="boton boton--peligro" onClick={() => setConfirmando(true)}>
                Anular pedido
              </button>
            </>
          )}
          {!anulado && !pedido.se_puede_anular && (
            <p className="tenue">Ya pasaron los {MINUTOS_PARA_ANULAR} minutos: este pedido no se puede anular.</p>
          )}
          <Link to="/pedidos" className="boton boton--texto">Volver a pedidos</Link>
        </aside>
      </div>

      <DialogoConfirmar
        abierto={confirmando}
        titulo={`¿Anular el pedido #${pedido.id}?`}
        textoConfirmar="Sí, anular pedido"
        onConfirmar={anular}
        onCerrar={() => setConfirmando(false)}
      >
        <p>Se devolverá {colones(pedido.total)} al cliente y los insumos de {pedido.items.length === 1 ? 'su producto' : `sus ${pedido.items.length} productos`} vuelven al inventario. No se puede deshacer.</p>
      </DialogoConfirmar>
    </>
  );
}

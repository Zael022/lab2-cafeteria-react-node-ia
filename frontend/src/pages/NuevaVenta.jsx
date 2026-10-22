// Nueva venta: elegir productos, forma de pago y cobrar.
// Al cobrar se llama a POST /api/pedidos; la API valida que alcancen
// los insumos y descuenta todo en una transacción.
import { useState } from 'react';
import Encabezado from '../components/Encabezado.jsx';
import Ticket from '../components/Ticket.jsx';
import { Buscador } from '../components/Piezas.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAvisos } from '../components/Avisos.jsx';
import { crearPedido, getProductos } from '../services/api.js';
import { CATEGORIAS } from '../utils/constantes.js';
import { colones } from '../utils/formato.js';

export default function NuevaVenta() {
  const { avisar } = useAvisos();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const productos = useFetch(() => getProductos({ activo: true, q: busqueda, categoria }), [busqueda, categoria]);

  // El tiquete: [{ producto, cantidad }]
  const [lineas, setLineas] = useState([]);
  const [metodo, setMetodo] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [errorCobro, setErrorCobro] = useState(null);
  const [pedido, setPedido] = useState(null);

  function agregar(producto) {
    setErrorCobro(null);
    setLineas((actual) => {
      const existente = actual.find((l) => l.producto.id === producto.id);
      if (!existente) return [...actual, { producto, cantidad: 1 }];
      if (existente.cantidad >= producto.porciones_disponibles) return actual;
      return actual.map((l) => (l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l));
    });
  }

  function cambiarCantidad(productoId, cantidad) {
    setErrorCobro(null);
    setLineas((actual) =>
      cantidad <= 0
        ? actual.filter((l) => l.producto.id !== productoId)
        : actual.map((l) => (l.producto.id === productoId ? { ...l, cantidad } : l))
    );
  }

  async function cobrar() {
    setCobrando(true);
    setErrorCobro(null);
    try {
      const nuevo = await crearPedido({
        metodo_pago: metodo,
        items: lineas.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
      });
      setPedido(nuevo);
      avisar(`Pedido #${nuevo.id} cobrado`, { enlace: `/pedidos/${nuevo.id}`, textoEnlace: 'Ver pedido' });
      productos.recargar(); // las porciones disponibles cambiaron
    } catch (err) {
      setErrorCobro(err); // 409 si no alcanzan los insumos, 400 si algo vino mal
    } finally {
      setCobrando(false);
    }
  }

  function nuevaVenta() {
    setLineas([]);
    setMetodo('');
    setPedido(null);
    setErrorCobro(null);
  }

  const enTicket = (id) => lineas.find((l) => l.producto.id === id)?.cantidad ?? 0;

  return (
    <>
      <Encabezado
        migas={[{ texto: 'Mostrador' }, { texto: 'Nueva venta' }]}
        titulo="Nueva venta"
        descripcion="Tocá los productos para agregarlos al tiquete, elegí la forma de pago y cobrá."
      />

      <div className="venta">
        <section className="venta__catalogo" aria-label="Productos">
          <div className="filtros">
            <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Ej. latte, croissant…" etiqueta="Buscar producto" />
          </div>
          <div className="chips" role="group" aria-label="Filtrar por categoría">
            {['', ...CATEGORIAS].map((c) => (
              <button key={c || 'todas'} type="button" className={`chip ${categoria === c ? 'chip--activo' : ''}`} aria-pressed={categoria === c} onClick={() => setCategoria(c)}>
                {c ? c[0].toUpperCase() + c.slice(1) : 'Todo'}
              </button>
            ))}
          </div>

          {productos.cargando && !productos.datos && <Cargando />}
          <MensajeError error={productos.error} onReintentar={productos.recargar} />

          {productos.datos && productos.datos.length === 0 && (
            <Vacio titulo="Ningún producto coincide">
              <p>Probá con otra palabra o elegí “Todo”.</p>
            </Vacio>
          )}

          {productos.datos && productos.datos.length > 0 && (
            <ul className="productos-venta">
              {productos.datos.map((p) => {
                const cantidad = enTicket(p.id);
                const agotado = p.porciones_disponibles === 0;
                const sinMas = cantidad >= p.porciones_disponibles;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`producto-venta ${cantidad > 0 ? 'producto-venta--en-ticket' : ''}`}
                      onClick={() => agregar(p)}
                      disabled={!!pedido || sinMas}
                    >
                      <span className="producto-venta__nombre">{p.nombre}</span>
                      <span className="producto-venta__precio">{colones(p.precio)}</span>
                      <span className="producto-venta__estado">
                        {agotado ? 'Agotado: faltan insumos' : sinMas ? 'No alcanza para más' : `Alcanza para ${p.porciones_disponibles - cantidad} más`}
                      </span>
                      {cantidad > 0 && <span className="producto-venta__contador" aria-label={`${cantidad} en el tiquete`}>{cantidad}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Ticket
          lineas={lineas}
          metodo={metodo}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={(id) => cambiarCantidad(id, 0)}
          onMetodo={setMetodo}
          onCobrar={cobrar}
          cobrando={cobrando}
          error={errorCobro}
          pedido={pedido}
          onNuevaVenta={nuevaVenta}
        />
      </div>
    </>
  );
}

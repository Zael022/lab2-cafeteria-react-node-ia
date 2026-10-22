// Detalle de un producto: su receta con el stock de cada insumo
// (datos relacionados de GET /api/productos/:id) y cuánto se ha vendido.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import DialogoConfirmar from '../components/DialogoConfirmar.jsx';
import { EstadoProducto } from '../components/ListaProductos.jsx';
import { Cargando, MensajeError } from '../components/Estados.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { actualizarProducto, eliminarProducto, getProducto } from '../services/api.js';
import { cantidad, colones } from '../utils/formato.js';

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useAvisos();
  const { datos: producto, cargando, error, recargar } = useFetch(() => getProducto(id), [id]);
  const [confirmando, setConfirmando] = useState(false);

  async function eliminar() {
    await eliminarProducto(id); // 409 si tiene ventas: lo muestra el diálogo
    setConfirmando(false);
    avisar(`“${producto.nombre}” eliminado`);
    navigate('/productos');
  }

  // Salida que ofrece el diálogo cuando la API responde 409
  async function desactivar() {
    await actualizarProducto(id, {
      nombre: producto.nombre,
      precio: producto.precio,
      categoria: producto.categoria,
      activo: false,
      receta: producto.receta.map((r) => ({ insumo_id: r.insumo_id, cantidad: r.cantidad })),
    });
    setConfirmando(false);
    avisar(`“${producto.nombre}” desactivado: ya no aparece en Nueva venta`);
    recargar();
  }

  const migas = [{ texto: 'Inventario' }, { texto: 'Productos', a: '/productos' }, { texto: producto?.nombre ?? '…' }];

  if (cargando && !producto) return <><Encabezado migas={migas} titulo="Producto" /><Cargando /></>;
  if (error)
    return (
      <>
        <Encabezado migas={migas} titulo="Producto" />
        <MensajeError error={error}>
          <Link to="/productos" className="boton boton--secundario boton--chico">Volver a productos</Link>
        </MensajeError>
      </>
    );

  // El insumo que primero se acaba es el que limita las porciones
  const limitante = [...producto.receta].sort((a, b) => a.alcanza_para - b.alcanza_para)[0];

  return (
    <>
      <Encabezado migas={migas} titulo={producto.nombre} descripcion={`${producto.categoria[0].toUpperCase() + producto.categoria.slice(1)} · ${colones(producto.precio)} sin IVA`}>
        <Link to={`/productos/${id}/editar`} className="boton boton--secundario">
          Editar
        </Link>
        <button type="button" className="boton boton--peligro-suave" onClick={() => setConfirmando(true)}>
          Eliminar
        </button>
      </Encabezado>

      <section className="metricas metricas--compactas" aria-label="Resumen del producto">
        <div className="metrica">
          <span className="metrica__etiqueta">Disponibilidad</span>
          <EstadoProducto producto={producto} />
          {limitante && producto.activo && <span className="metrica__detalle">Lo limita: {limitante.nombre}</span>}
        </div>
        <div className="metrica">
          <span className="metrica__etiqueta">Unidades vendidas</span>
          <strong className="metrica__valor">{producto.unidades_vendidas}</strong>
          <span className="metrica__detalle">Sin contar pedidos anulados</span>
        </div>
      </section>

      <section className="bloque">
        <h2>Receta de una unidad</h2>
        <div className="tabla">
          <div className="fila fila--cabecera fila--receta" aria-hidden="true">
            <span>Insumo</span>
            <span className="fila__dato--numero">Usa</span>
            <span className="fila__dato--numero">En stock</span>
            <span className="fila__dato--numero">Alcanza para</span>
          </div>
          <ul>
            {producto.receta.map((r) => (
              <li key={r.insumo_id} className={`fila fila--receta ${r === limitante ? 'fila--resaltada' : ''}`}>
                <Link to={`/insumos/${r.insumo_id}`} className="fila__principal">
                  <strong>{r.nombre}</strong>
                </Link>
                <span className="fila__dato fila__dato--numero">{cantidad(r.cantidad, r.unidad)}</span>
                <span className="fila__dato fila__dato--numero">{cantidad(r.stock, r.unidad)}</span>
                <span className="fila__dato fila__dato--numero">{r.alcanza_para}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DialogoConfirmar
        abierto={confirmando}
        titulo={`¿Eliminar “${producto.nombre}”?`}
        textoConfirmar="Sí, eliminar producto"
        onConfirmar={eliminar}
        onCerrar={() => setConfirmando(false)}
        accionesError={
          producto.activo && (
            <button type="button" className="boton boton--primario boton--chico" onClick={desactivar}>
              Desactivar en su lugar
            </button>
          )
        }
      >
        <p>Se borra el producto y su receta. Si ya tiene ventas, la API no lo permite para conservar el historial.</p>
      </DialogoConfirmar>
    </>
  );
}

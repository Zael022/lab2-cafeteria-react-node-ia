// Detalle de un insumo: su stock y los productos que lo usan.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Encabezado from '../components/Encabezado.jsx';
import DialogoConfirmar from '../components/DialogoConfirmar.jsx';
import { BarraStock, Insignia } from '../components/Piezas.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eliminarInsumo, getInsumo } from '../services/api.js';
import { cantidad } from '../utils/formato.js';

export default function InsumoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { avisar } = useAvisos();
  const { datos: insumo, cargando, error } = useFetch(() => getInsumo(id), [id]);
  const [confirmando, setConfirmando] = useState(false);

  async function eliminar() {
    await eliminarInsumo(id); // 409 si está en alguna receta
    setConfirmando(false);
    avisar(`“${insumo.nombre}” eliminado`);
    navigate('/insumos');
  }

  const migas = [{ texto: 'Inventario' }, { texto: 'Insumos', a: '/insumos' }, { texto: insumo?.nombre ?? '…' }];

  if (cargando && !insumo) return <><Encabezado migas={migas} titulo="Insumo" /><Cargando /></>;
  if (error)
    return (
      <>
        <Encabezado migas={migas} titulo="Insumo" />
        <MensajeError error={error}>
          <Link to="/insumos" className="boton boton--secundario boton--chico">Volver a insumos</Link>
        </MensajeError>
      </>
    );

  return (
    <>
      <Encabezado migas={migas} titulo={insumo.nombre} descripcion={`Se mide en ${insumo.unidad === 'unidad' ? 'unidades' : insumo.unidad}.`}>
        <Link to={`/insumos/${id}/editar`} className="boton boton--primario">
          Reabastecer o editar
        </Link>
        <button type="button" className="boton boton--peligro-suave" onClick={() => setConfirmando(true)}>
          Eliminar
        </button>
      </Encabezado>

      <section className="bloque">
        <div className="bloque__cabecera">
          <h2>Stock</h2>
          {insumo.bajo_minimo ? <Insignia tono="peligro">Bajo el mínimo: toca comprar</Insignia> : <Insignia tono="ok">Suficiente</Insignia>}
        </div>
        <BarraStock stock={insumo.stock} minimo={insumo.stock_minimo} unidad={insumo.unidad} />
        {insumo.bajo_minimo && (
          <p className="tenue">
            Faltan {cantidad(insumo.stock_minimo - insumo.stock, insumo.unidad)} para llegar al mínimo.{' '}
            <Link to="/asistente">Pedir sugerencia de compra</Link>
          </p>
        )}
      </section>

      <section className="bloque">
        <h2>Productos que lo usan</h2>
        {insumo.usado_en.length === 0 ? (
          <Vacio titulo="Ningún producto lo usa todavía">
            <p>Se puede eliminar sin problema.</p>
          </Vacio>
        ) : (
          <ul className="lineas">
            {insumo.usado_en.map((p) => (
              <li key={p.producto_id}>
                <Link to={`/productos/${p.producto_id}`}>{p.nombre}</Link>
                <span>{cantidad(p.cantidad, insumo.unidad)} por unidad</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DialogoConfirmar
        abierto={confirmando}
        titulo={`¿Eliminar “${insumo.nombre}”?`}
        textoConfirmar="Sí, eliminar insumo"
        onConfirmar={eliminar}
        onCerrar={() => setConfirmando(false)}
      >
        <p>
          {insumo.usado_en.length > 0
            ? `Está en la receta de ${insumo.usado_en.length} ${insumo.usado_en.length === 1 ? 'producto' : 'productos'}: la API no permitirá eliminarlo hasta quitarlo de esas recetas.`
            : 'No está en ninguna receta. No se puede deshacer.'}
        </p>
      </DialogoConfirmar>
    </>
  );
}

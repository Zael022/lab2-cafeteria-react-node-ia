// Lista de productos (componente "lista") + cada fila (componente "item").
import { Link } from 'react-router-dom';
import { colones } from '../utils/formato.js';
import { Insignia } from './Piezas.jsx';

/** Qué tan disponible está un producto, en palabras. */
export function EstadoProducto({ producto }) {
  if (!producto.activo) return <Insignia tono="neutro">Inactivo</Insignia>;
  if (producto.porciones_disponibles === 0) return <Insignia tono="peligro">Agotado</Insignia>;
  if (producto.porciones_disponibles < 10)
    return <Insignia tono="aviso">Quedan {producto.porciones_disponibles}</Insignia>;
  return <Insignia tono="ok">Alcanza para {producto.porciones_disponibles}</Insignia>;
}

export function ItemProducto({ producto }) {
  return (
    <li className="fila">
      <Link to={`/productos/${producto.id}`} className="fila__principal">
        <strong>{producto.nombre}</strong>
        <span className="tenue">{producto.categoria}</span>
      </Link>
      <span className="fila__dato fila__dato--numero">{colones(producto.precio)}</span>
      <span className="fila__dato">
        <EstadoProducto producto={producto} />
      </span>
    </li>
  );
}

export default function ListaProductos({ productos }) {
  return (
    <div className="tabla">
      <div className="fila fila--cabecera" aria-hidden="true">
        <span>Producto</span>
        <span className="fila__dato--numero">Precio</span>
        <span>Disponibilidad</span>
      </div>
      <ul>
        {productos.map((p) => (
          <ItemProducto key={p.id} producto={p} />
        ))}
      </ul>
    </div>
  );
}

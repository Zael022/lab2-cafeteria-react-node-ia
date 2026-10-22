// Lista de insumos + cada fila. La barra muestra el stock contra el mínimo.
import { Link } from 'react-router-dom';
import { BarraStock, Insignia } from './Piezas.jsx';

export function ItemInsumo({ insumo }) {
  return (
    <li className="fila fila--insumo">
      <Link to={`/insumos/${insumo.id}`} className="fila__principal">
        <strong>{insumo.nombre}</strong>
        {insumo.bajo_minimo ? (
          <Insignia tono="peligro">Bajo el mínimo</Insignia>
        ) : (
          <Insignia tono="ok">Suficiente</Insignia>
        )}
      </Link>
      <span className="fila__dato fila__dato--ancho">
        <BarraStock stock={insumo.stock} minimo={insumo.stock_minimo} unidad={insumo.unidad} />
      </span>
    </li>
  );
}

export default function ListaInsumos({ insumos }) {
  return (
    <div className="tabla">
      <div className="fila fila--cabecera fila--insumo" aria-hidden="true">
        <span>Insumo</span>
        <span>Stock (la marca es el mínimo)</span>
      </div>
      <ul>
        {insumos.map((i) => (
          <ItemInsumo key={i.id} insumo={i} />
        ))}
      </ul>
    </div>
  );
}

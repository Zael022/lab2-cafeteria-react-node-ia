// Fila de puntos con check naranja: un título corto y una línea que lo
// explica. Sirve para contar "cómo funciona" algo sin párrafos largos.
//
// puntos: [{ titulo: 'Anular en 15 minutos', texto: '...' }]
import { IconoCheck } from './Iconos.jsx';

export default function ListaChecks({ puntos, columnas = false }) {
  return (
    <ul className={`checks ${columnas ? 'checks--columnas' : ''}`}>
      {puntos.map((p) => (
        <li key={p.titulo}>
          <IconoCheck />
          <span>
            <strong>{p.titulo}</strong>
            <span className="checks__texto">{p.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Encabezado de cada vista: migas de pan + título + qué se hace aquí
// + botones de acción. Responde siempre a "¿dónde estoy?" y
// "¿cómo vuelvo?".
//
// migas: [{ texto: 'Inventario' }, { texto: 'Productos', a: '/productos' }]
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Encabezado({ migas = [], titulo, descripcion, children }) {
  // El título de la pestaña del navegador también dice dónde estás
  useEffect(() => {
    if (titulo) document.title = `${titulo} · Mostrador`;
  }, [titulo]);

  return (
    <header className="encabezado">
      {migas.length > 0 && (
        <nav aria-label="Estás en" className="migas">
          <ol>
            {migas.map((miga, i) => (
              <li key={i}>
                {miga.a ? <Link to={miga.a}>{miga.texto}</Link> : <span>{miga.texto}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="encabezado__fila">
        <div>
          <h1>{titulo}</h1>
          {descripcion && <p className="encabezado__descripcion">{descripcion}</p>}
        </div>
        {children && <div className="encabezado__acciones">{children}</div>}
      </div>
    </header>
  );
}

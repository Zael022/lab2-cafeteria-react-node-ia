// Portada oscura con paneles de vidrio translúcido. Se usa solo en las
// pantallas de "Negocio" (Panel del día y Asistente de compras), para
// que se distingan del trabajo de mostrador.
//
// El fondo es un patrón de granos de café dibujado en SVG (index.css)
// y el "vidrio" es un fondo blanco al 10 % con desenfoque (backdrop-filter).
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Portada({ migas = [], antetitulo, titulo, descripcion, children }) {
  useEffect(() => {
    if (titulo) document.title = `${titulo} · Mostrador`;
  }, [titulo]);

  return (
    <section className="portada">
      {migas.length > 0 && (
        <nav aria-label="Estás en" className="migas migas--claras">
          <ol>
            {migas.map((miga, i) => (
              <li key={i}>{miga.a ? <Link to={miga.a}>{miga.texto}</Link> : <span>{miga.texto}</span>}</li>
            ))}
          </ol>
        </nav>
      )}
      {antetitulo && <p className="portada__antetitulo">{antetitulo}</p>}
      <h1 className="portada__titulo">{titulo}</h1>
      {descripcion && <p className="portada__descripcion">{descripcion}</p>}
      {children}
    </section>
  );
}

/** Panel de vidrio para poner encima de la portada. */
export function Vidrio({ children, className = '', as: Etiqueta = 'div', ...resto }) {
  return (
    <Etiqueta className={`vidrio ${className}`} {...resto}>
      {children}
    </Etiqueta>
  );
}

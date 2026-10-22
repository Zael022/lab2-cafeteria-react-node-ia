// Gráfico de barras hecho solo con HTML y CSS (sin librerías).
// Cada barra mide proporcionalmente a su valor respecto al mayor.
// Siempre se muestra el número escrito, así no hay que adivinar
// por el tamaño de la barra.
//
// datos: [{ clave, etiqueta, valor, texto, enlace? }]
// orientacion: 'horizontal' (filas) | 'vertical' (columnas por día)
import { Link } from 'react-router-dom';

export default function GraficoBarras({ datos, orientacion = 'horizontal', descripcion, resaltar }) {
  const maximo = Math.max(...datos.map((d) => d.valor), 0);
  const porcentaje = (v) => (maximo === 0 ? 0 : Math.max((v / maximo) * 100, v > 0 ? 2 : 0));

  return (
    <figure className={`grafico grafico--${orientacion}`}>
      {descripcion && <figcaption className="sr-only">{descripcion}</figcaption>}
      <ul>
        {datos.map((d) => {
          const etiqueta = d.enlace ? <Link to={d.enlace}>{d.etiqueta}</Link> : d.etiqueta;
          return (
            <li
              key={d.clave}
              className={`grafico__fila ${resaltar === d.clave ? 'grafico__fila--resaltada' : ''}`}
              title={`${d.etiqueta}: ${d.texto}`}
            >
              <span className="grafico__etiqueta">{etiqueta}</span>
              <span className="grafico__pista">
                <span
                  className="grafico__barra"
                  style={orientacion === 'vertical' ? { height: `${porcentaje(d.valor)}%` } : { width: `${porcentaje(d.valor)}%` }}
                />
              </span>
              <span className="grafico__valor">{d.texto}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

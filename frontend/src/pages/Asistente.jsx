// Asistente de compras: llama al workflow de n8n (Webhook → AI Agent →
// Respond to Webhook). El agente consulta la API de la cafetería como
// herramienta y redacta una sugerencia de compra justificada.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Portada, { Vidrio } from '../components/Portada.jsx';
import ListaChecks from '../components/ListaChecks.jsx';
import { Campo, Insignia } from '../components/Piezas.jsx';
import { Cargando, MensajeError, Vacio } from '../components/Estados.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getDatosCompras, pedirSugerenciaCompra } from '../services/api.js';
import { cantidad, hora } from '../utils/formato.js';

const TONO_PRIORIDAD = { alta: 'peligro', media: 'aviso', baja: 'neutro' };
const LIMITE_NOTA = 300;

const QUE_REVISA = [
  { titulo: 'Insumos bajo el mínimo', texto: 'Los que ya están por debajo del stock mínimo.' },
  { titulo: 'Consumo real de 7 días', texto: 'Ventas cobradas multiplicadas por cada receta.' },
  { titulo: 'Días de cobertura', texto: 'Cuánto dura el stock actual al ritmo de venta.' },
];

export default function Asistente() {
  const datos = useFetch(() => getDatosCompras(), []);
  const [dias, setDias] = useState('7');
  const [nota, setNota] = useState('');
  const [errorNota, setErrorNota] = useState(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [error, setError] = useState(null);
  const [sugerencia, setSugerencia] = useState(null);

  async function pedir(evento) {
    evento?.preventDefault();
    if (nota.length > LIMITE_NOTA) {
      setErrorNota(`La nota puede tener hasta ${LIMITE_NOTA} caracteres.`);
      return;
    }
    setPidiendo(true);
    setError(null);
    try {
      const data = await pedirSugerenciaCompra({ diasACubrir: Number(dias), nota: nota.trim() });
      setSugerencia({ ...data, generada: new Date().toISOString() });
    } catch (err) {
      setError(err);
    } finally {
      setPidiendo(false);
    }
  }

  const compras = Array.isArray(sugerencia?.compras) ? sugerencia.compras : [];

  return (
    <>
      <Portada
        migas={[{ texto: 'Negocio' }, { texto: 'Asistente de compras' }]}
        antetitulo="Asistente con inteligencia artificial"
        titulo="¿Qué hay que comprar?"
        descripcion="Un agente revisa el inventario y las ventas de la semana, y propone qué comprar y cuánto, explicando por qué."
      >
        <Vidrio as="form" className="portada__formulario" onSubmit={pedir} noValidate>
          <Campo etiqueta="Comprar para cubrir" className="campo--claro">
            <select value={dias} onChange={(e) => setDias(e.target.value)}>
              <option value="7">Una semana</option>
              <option value="14">Dos semanas</option>
              <option value="30">Un mes</option>
            </select>
          </Campo>
          <Campo
            etiqueta="Nota para el agente (opcional)"
            className="campo--claro campo--ancho"
            error={errorNota}
            // El contador solo aparece cerca del límite, para que los tres
            // controles queden alineados en la misma línea
            ayuda={nota.length > LIMITE_NOTA - 50 ? `${nota.length}/${LIMITE_NOTA} caracteres` : undefined}
          >
            <input
              value={nota}
              placeholder="Ej. el sábado hay un evento con 40 personas"
              maxLength={LIMITE_NOTA + 50}
              onChange={(e) => {
                setNota(e.target.value);
                setErrorNota(null);
              }}
            />
          </Campo>
          <button type="submit" className="boton boton--claro" disabled={pidiendo}>
            {pidiendo ? 'Analizando…' : 'Pedir sugerencia'}
          </button>
        </Vidrio>
      </Portada>

      <div className="asistente">
        <div className="asistente__resultado">
          {pidiendo && (
            <div className="bloque">
              <Cargando texto="El agente está revisando el inventario y las ventas. Puede tardar unos segundos." />
            </div>
          )}

          {!pidiendo && error && <MensajeError error={error} titulo="El asistente no respondió" onReintentar={() => pedir()} />}

          {!pidiendo && sugerencia && (
            <section className="bloque sugerencia" aria-live="polite">
              <div className="bloque__cabecera">
                <h2>Sugerencia</h2>
                <span className="tenue">Generada a las {hora(sugerencia.generada)}</span>
              </div>
              {sugerencia.resumen && <p className="sugerencia__resumen">{sugerencia.resumen}</p>}
              {compras.length === 0 ? (
                <Vacio titulo="No hace falta comprar nada por ahora" />
              ) : (
                <ul className="compras">
                  {compras.map((c, i) => (
                    <li key={i} className="compra">
                      <div className="compra__cabecera">
                        <strong>{c.insumo}</strong>
                        {c.prioridad && <Insignia tono={TONO_PRIORIDAD[c.prioridad] ?? 'neutro'}>Prioridad {c.prioridad}</Insignia>}
                      </div>
                      <p className="compra__cantidad">Comprar {cantidad(c.cantidad, c.unidad)}</p>
                      <p className="compra__porque">{c.justificacion}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/insumos" className="boton boton--secundario boton--chico">
                Ir a insumos para reabastecer
              </Link>
            </section>
          )}

          {!pidiendo && !sugerencia && !error && (
            <section className="bloque">
              <div className="bloque__cabecera">
                <h2>Lo que verá el agente ahora</h2>
                <Link to="/insumos?bajo_minimo=true">Ver en insumos</Link>
              </div>
              {datos.cargando && <Cargando />}
              <MensajeError error={datos.error} onReintentar={datos.recargar} />
              {datos.datos && datos.datos.insumos_bajo_minimo.length === 0 && <Vacio titulo="Ningún insumo está bajo el mínimo" />}
              {datos.datos && datos.datos.insumos_bajo_minimo.length > 0 && (
                <ul className="lineas">
                  {datos.datos.insumos_bajo_minimo.map((i) => (
                    <li key={i.id}>
                      <span>
                        <Link to={`/insumos/${i.id}`}>{i.nombre}</Link>
                        <span className="tenue"> · quedan {cantidad(i.stock, i.unidad)}, mínimo {cantidad(i.stock_minimo, i.unidad)}</span>
                      </span>
                      <span>
                        {i.dias_de_cobertura === null ? 'Sin ventas esta semana' : i.dias_de_cobertura === 0 ? 'Agotado' : `Alcanza ${i.dias_de_cobertura} días`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="bloque bloque--info">
          <h2>Qué revisa el agente</h2>
          <ListaChecks puntos={QUE_REVISA} />
          <p className="tenue">La sugerencia es un borrador: revisala antes de comprar.</p>
        </aside>
      </div>
    </>
  );
}

// Formulario controlado para crear o editar un producto con su receta.
// La receta es una lista de filas "insumo + cantidad" que se pueden
// agregar y quitar.
import { useState } from 'react';
import { getInsumos } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { CATEGORIAS } from '../utils/constantes.js';
import { Campo } from './Piezas.jsx';
import { Cargando, MensajeError } from './Estados.jsx';
import { IconoBasura, IconoMas } from './Iconos.jsx';

const VACIO = { nombre: '', precio: '', categoria: CATEGORIAS[0], activo: true, receta: [{ insumo_id: '', cantidad: '' }] };

function validar(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribí el nombre del producto.';
  if (datos.precio === '' || Number(datos.precio) <= 0) errores.precio = 'El precio debe ser mayor que 0.';

  const lineas = datos.receta.filter((l) => l.insumo_id !== '' || l.cantidad !== '');
  if (lineas.length === 0) {
    errores.receta = 'Agregá al menos un insumo a la receta.';
  } else if (lineas.some((l) => l.insumo_id === '' || !(Number(l.cantidad) > 0))) {
    errores.receta = 'Cada línea necesita un insumo y una cantidad mayor que 0.';
  } else if (new Set(lineas.map((l) => l.insumo_id)).size !== lineas.length) {
    errores.receta = 'Un insumo aparece dos veces: juntá las cantidades en una sola línea.';
  }
  return errores;
}

export default function FormularioProducto({ inicial, textoBoton, onGuardar, onCancelar }) {
  const insumos = useFetch(() => getInsumos({ orden: 'nombre' }), []);
  const [datos, setDatos] = useState(() =>
    inicial
      ? {
          ...inicial,
          precio: String(inicial.precio),
          receta: inicial.receta.map((r) => ({ insumo_id: String(r.insumo_id), cantidad: String(r.cantidad) })),
        }
      : VACIO
  );
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  function cambiarLinea(indice, campo, valor) {
    setDatos((d) => ({
      ...d,
      receta: d.receta.map((linea, i) => (i === indice ? { ...linea, [campo]: valor } : linea)),
    }));
    setErrores((e) => ({ ...e, receta: undefined }));
  }

  const agregarLinea = () => setDatos((d) => ({ ...d, receta: [...d.receta, { insumo_id: '', cantidad: '' }] }));
  const quitarLinea = (indice) => setDatos((d) => ({ ...d, receta: d.receta.filter((_, i) => i !== indice) }));

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validar(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    setErrorApi(null);
    try {
      await onGuardar({
        nombre: datos.nombre.trim(),
        precio: Number(datos.precio),
        categoria: datos.categoria,
        activo: datos.activo,
        receta: datos.receta
          .filter((l) => l.insumo_id !== '')
          .map((l) => ({ insumo_id: Number(l.insumo_id), cantidad: Number(l.cantidad) })),
      });
    } catch (err) {
      setErrorApi(err);
    } finally {
      setGuardando(false);
    }
  }

  const unidadDe = (insumoId) => insumos.datos?.find((i) => String(i.id) === insumoId)?.unidad ?? '';

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <MensajeError error={errorApi} />

      <Campo etiqueta="Nombre" error={errores.nombre}>
        <input value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej. Capuchino de vainilla" autoFocus />
      </Campo>

      <div className="formulario__par">
        <Campo etiqueta="Precio (colones, sin IVA)" error={errores.precio}>
          <input type="number" min="0" step="50" inputMode="numeric" value={datos.precio} onChange={(e) => cambiar('precio', e.target.value)} />
        </Campo>
        <Campo etiqueta="Categoría">
          <select value={datos.categoria} onChange={(e) => cambiar('categoria', e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <label className="interruptor">
        <input type="checkbox" checked={datos.activo} onChange={(e) => cambiar('activo', e.target.checked)} />
        <span>
          <strong>Se vende en el mostrador</strong>
          <span className="tenue">Si lo desactivás, deja de aparecer en Nueva venta pero conserva su historial.</span>
        </span>
      </label>

      <fieldset className="receta">
        <legend>Receta de una unidad</legend>
        <p className="tenue">Lo que se descuenta del inventario cada vez que se vende uno.</p>

        {insumos.cargando && <Cargando texto="Cargando insumos…" />}
        <MensajeError error={insumos.error} onReintentar={insumos.recargar} />

        {insumos.datos && (
          <ul className="receta__lineas">
            {datos.receta.map((linea, i) => (
              <li key={i} className="receta__linea">
                <Campo etiqueta={`Insumo ${i + 1}`}>
                  <select value={linea.insumo_id} onChange={(e) => cambiarLinea(i, 'insumo_id', e.target.value)}>
                    <option value="">Elegí un insumo…</option>
                    {insumos.datos.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta={`Cantidad${unidadDe(linea.insumo_id) ? ` (${unidadDe(linea.insumo_id)})` : ''}`}>
                  <input type="number" min="0" step="any" inputMode="decimal" value={linea.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} />
                </Campo>
                <button
                  type="button"
                  className="boton-icono receta__quitar"
                  onClick={() => quitarLinea(i)}
                  disabled={datos.receta.length === 1}
                  aria-label={`Quitar insumo ${i + 1}`}
                >
                  <IconoBasura />
                </button>
              </li>
            ))}
          </ul>
        )}
        {errores.receta && <p className="campo__error">{errores.receta}</p>}

        <button type="button" className="boton boton--secundario boton--chico" onClick={agregarLinea}>
          <IconoMas /> Agregar insumo
        </button>
      </fieldset>

      <div className="formulario__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </form>
  );
}

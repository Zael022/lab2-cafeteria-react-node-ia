// Formulario controlado para crear o editar un insumo.
// "Controlado" = cada input muestra lo que hay en el estado de React
// y cada tecla actualiza ese estado.
import { useState } from 'react';
import { UNIDADES } from '../utils/constantes.js';
import { Campo } from './Piezas.jsx';
import { MensajeError } from './Estados.jsx';

const VACIO = { nombre: '', unidad: 'g', stock: '', stock_minimo: '' };

/** Mismas reglas que valida la API, para avisar antes de enviar. */
function validar(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribí el nombre del insumo.';
  if (datos.stock === '' || Number(datos.stock) < 0) errores.stock = 'El stock debe ser 0 o más.';
  if (datos.stock_minimo === '' || Number(datos.stock_minimo) < 0)
    errores.stock_minimo = 'El mínimo debe ser 0 o más.';
  return errores;
}

export default function FormularioInsumo({ inicial, textoBoton, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(inicial ? { ...VACIO, ...inicial } : VACIO);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

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
        unidad: datos.unidad,
        stock: Number(datos.stock),
        stock_minimo: Number(datos.stock_minimo),
      });
    } catch (err) {
      setErrorApi(err); // 400 o 409 que devolvió la API
    } finally {
      setGuardando(false);
    }
  }

  const unidadTexto = UNIDADES.find((u) => u.valor === datos.unidad)?.texto ?? '';

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <MensajeError error={errorApi} />

      <Campo etiqueta="Nombre" error={errores.nombre}>
        <input value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej. Leche deslactosada" autoFocus />
      </Campo>

      <Campo etiqueta="Unidad de medida" ayuda="Las recetas usan esta misma unidad.">
        <select value={datos.unidad} onChange={(e) => cambiar('unidad', e.target.value)}>
          {UNIDADES.map((u) => (
            <option key={u.valor} value={u.valor}>
              {u.texto}
            </option>
          ))}
        </select>
      </Campo>

      <div className="formulario__par">
        <Campo etiqueta="Stock actual" error={errores.stock} ayuda={`En ${unidadTexto}.`}>
          <input type="number" min="0" step="any" inputMode="decimal" value={datos.stock} onChange={(e) => cambiar('stock', e.target.value)} />
        </Campo>
        <Campo etiqueta="Stock mínimo" error={errores.stock_minimo} ayuda="Por debajo de esto, toca comprar.">
          <input type="number" min="0" step="any" inputMode="decimal" value={datos.stock_minimo} onChange={(e) => cambiar('stock_minimo', e.target.value)} />
        </Campo>
      </div>

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

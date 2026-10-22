// Ventana de confirmación antes de una acción que no se puede deshacer
// (eliminar, anular). Usa la etiqueta <dialog> nativa del navegador,
// que ya bloquea el resto de la página y se cierra con Escape.
//
// Si la API responde con error (por ejemplo 409), el mensaje se muestra
// DENTRO de la ventana, para que se entienda qué acción falló.
import { useEffect, useRef, useState } from 'react';
import { MensajeError } from './Estados.jsx';

export default function DialogoConfirmar({
  abierto,
  titulo,
  children,
  textoConfirmar,
  peligroso = true,
  onConfirmar, // función async: si lanza un error, se muestra aquí
  onCerrar,
  accionesError, // botones extra cuando hay error (ej. "Desactivar")
}) {
  const ref = useRef(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (abierto && !dialogo.open) {
      setError(null);
      dialogo.showModal();
    }
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  async function confirmar() {
    setTrabajando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (err) {
      setError(err);
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <dialog ref={ref} className="dialogo" onClose={onCerrar} aria-labelledby="dialogo-titulo">
      <h2 id="dialogo-titulo">{titulo}</h2>
      <div className="dialogo__cuerpo">{children}</div>

      <MensajeError error={error}>{error && accionesError}</MensajeError>

      <div className="dialogo__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={trabajando}>
          {error ? 'Cerrar' : 'Cancelar'}
        </button>
        {!error && (
          <button
            type="button"
            className={`boton ${peligroso ? 'boton--peligro' : 'boton--primario'}`}
            onClick={confirmar}
            disabled={trabajando}
          >
            {trabajando ? 'Un momento…' : textoConfirmar}
          </button>
        )}
      </div>
    </dialog>
  );
}

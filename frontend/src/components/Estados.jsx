// Componentes para los estados de una carga: cargando, error y vacío.
// Se usan en todas las vistas, así siempre se ven igual.
import { IconoAlerta } from './Iconos.jsx';

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando__punto" aria-hidden="true" />
      {texto}
    </div>
  );
}

/**
 * Muestra el mensaje de error que mandó la API ({ error: "..." }).
 * Si se pasa onReintentar, aparece un botón para volver a intentar.
 */
export function MensajeError({ error, titulo, onReintentar, children }) {
  if (!error) return null;
  const mensaje = typeof error === 'string' ? error : error.message;
  const tituloFinal =
    titulo ??
    (error.status === 409
      ? 'No se puede hacer esa operación'
      : error.status === 404
        ? 'No se encontró'
        : error.status === 400
          ? 'Revisá los datos'
          : 'Algo falló');

  return (
    <div className="mensaje mensaje--error" role="alert">
      <IconoAlerta />
      <div>
        <strong>{tituloFinal}</strong>
        <p>{mensaje}</p>
        {(onReintentar || children) && (
          <div className="mensaje__acciones">
            {children}
            {onReintentar && (
              <button type="button" className="boton boton--secundario boton--chico" onClick={onReintentar}>
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Lista vacía: explica qué pasa y ofrece qué hacer. */
export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <strong>{titulo}</strong>
      {children}
    </div>
  );
}

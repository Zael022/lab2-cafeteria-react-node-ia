// Piezas pequeñas reutilizables: insignias, tarjeta de métrica,
// barra de stock, buscador y campo de formulario.
import { cloneElement, useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { cantidad } from '../utils/formato.js';

/** Etiqueta de estado. tono: 'ok' | 'aviso' | 'peligro' | 'neutro' */
export function Insignia({ tono = 'neutro', children }) {
  return <span className={`insignia insignia--${tono}`}>{children}</span>;
}

/** Indicador del panel: un número grande con su explicación. */
export function TarjetaMetrica({ etiqueta, valor, detalle, tono, enlace }) {
  const contenido = (
    <>
      <span className="metrica__etiqueta">{etiqueta}</span>
      <strong className="metrica__valor">{valor}</strong>
      {detalle && <span className="metrica__detalle">{detalle}</span>}
    </>
  );
  const clase = `metrica ${tono ? `metrica--${tono}` : ''}`;
  return enlace ? (
    <Link to={enlace} className={`${clase} metrica--enlace`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

/**
 * Barra que compara el stock con el mínimo.
 * La marca vertical es el mínimo: si la barra no la alcanza, falta comprar.
 */
export function BarraStock({ stock, minimo, unidad }) {
  const tope = Math.max(stock, minimo * 2, 1);
  const bajo = stock < minimo;
  return (
    <div className="barra-stock">
      <div className="barra-stock__pista" aria-hidden="true">
        <div
          className={`barra-stock__relleno ${bajo ? 'barra-stock__relleno--bajo' : ''}`}
          style={{ width: `${Math.min(100, (stock / tope) * 100)}%` }}
        />
        <div className="barra-stock__minimo" style={{ left: `${(minimo / tope) * 100}%` }} />
      </div>
      <span className="barra-stock__texto">
        {cantidad(stock, unidad)} <span className="tenue">· mín. {cantidad(minimo, unidad)}</span>
      </span>
    </div>
  );
}

/**
 * Campo de búsqueda que espera a que el usuario deje de escribir
 * (300 ms) antes de avisar, para no pedirle a la API una búsqueda
 * por cada letra.
 */
export function Buscador({ valor, onCambiar, placeholder, etiqueta = 'Buscar' }) {
  const [texto, setTexto] = useState(valor);
  const [valorPrevio, setValorPrevio] = useState(valor);

  // Si el valor cambia desde afuera (ej. "Quitar filtros"), el campo
  // se actualiza. Se hace durante el render, como recomienda React.
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor);
  }

  useEffect(() => {
    if (texto === valor) return;
    const espera = setTimeout(() => onCambiar(texto), 300);
    return () => clearTimeout(espera);
  }, [texto, valor, onCambiar]);

  return (
    <Campo etiqueta={etiqueta} className="campo--buscador">
      <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} />
    </Campo>
  );
}

/**
 * Etiqueta + control + mensaje de error del campo.
 * La etiqueta se enlaza al control con un id (htmlFor), así al tocar el
 * texto se enfoca el campo y los lectores de pantalla lo anuncian bien.
 */
export function Campo({ etiqueta, error, ayuda, children, className = '' }) {
  const id = useId();
  const idMensaje = `${id}-mensaje`;
  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || ayuda ? idMensaje : undefined,
  });
  return (
    <div className={`campo ${error ? 'campo--error' : ''} ${className}`}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {control}
      {error ? (
        <span id={idMensaje} className="campo__error">{error}</span>
      ) : (
        ayuda && <span id={idMensaje} className="campo__ayuda">{ayuda}</span>
      )}
    </div>
  );
}

// Custom hook: carga datos de la API y maneja los tres estados
// (cargando, error, datos) para que cada vista no repita lo mismo.
//
// Uso:
//   const { datos, cargando, error, recargar } =
//     useFetch(() => getProductos(filtros), [filtros.q, filtros.orden]);
//
// Analogía: es como pedir en la barra. Mientras esperás → "cargando".
// Si se acabó el café → "error". Si llega → "datos".
import { useCallback, useEffect, useState } from 'react';

export function useFetch(cargar, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0); // cambiarla vuelve a cargar

  useEffect(() => {
    // Si el usuario cambia el filtro rápido, puede llegar primero la
    // respuesta vieja. Con "vigente" ignoramos las respuestas que ya
    // no corresponden a lo que se está mostrando.
    let vigente = true;
    setCargando(true);
    setError(null);

    cargar()
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((err) => {
        if (vigente) setError(err);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { datos, cargando, error, recargar };
}

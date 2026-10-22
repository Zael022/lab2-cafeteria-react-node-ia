// Custom hook: guarda la búsqueda, los filtros y el orden en la URL
// (por ejemplo /productos?q=cafe&categoria=snacks).
//
// ¿Por qué en la URL y no en useState? Porque así, si entrás a un
// producto y apretás "Atrás", la lista vuelve exactamente como la
// dejaste. También se puede copiar el link y compartirlo.
import { useSearchParams } from 'react-router-dom';

export function useFiltrosURL(valoresPorDefecto = {}) {
  const [params, setParams] = useSearchParams();

  // Junta los valores por defecto con lo que haya en la URL
  const filtros = { ...valoresPorDefecto };
  for (const clave of Object.keys(valoresPorDefecto)) {
    if (params.has(clave)) filtros[clave] = params.get(clave);
  }

  function cambiarFiltro(clave, valor) {
    const nuevos = new URLSearchParams(params);
    if (valor === '' || valor === undefined || valor === valoresPorDefecto[clave]) {
      nuevos.delete(clave); // no ensuciamos la URL con valores por defecto
    } else {
      nuevos.set(clave, valor);
    }
    setParams(nuevos, { replace: true });
  }

  function limpiarFiltros() {
    setParams({}, { replace: true });
  }

  const hayFiltros = Object.keys(valoresPorDefecto).some((c) => params.has(c));

  return { filtros, cambiarFiltro, limpiarFiltros, hayFiltros };
}

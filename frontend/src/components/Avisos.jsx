// Avisos flotantes ("Producto guardado", "Pedido #23 cobrado").
// Usa Context para que cualquier vista pueda mostrar un aviso con
//   const { avisar } = useAvisos();
//   avisar('Producto guardado', { enlace: '/productos/5', textoEnlace: 'Ver producto' });
import { createContext, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconoCheck, IconoCerrar } from './Iconos.jsx';

const AvisosContext = createContext(null);

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const cerrar = useCallback((id) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id));
  }, []);

  const avisar = useCallback(
    (texto, { enlace, textoEnlace } = {}) => {
      const id = Date.now() + Math.random();
      setAvisos((lista) => [...lista, { id, texto, enlace, textoEnlace }]);
      setTimeout(() => cerrar(id), 6000);
    },
    [cerrar]
  );

  return (
    <AvisosContext.Provider value={{ avisar }}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="aviso">
            <IconoCheck />
            <span>{a.texto}</span>
            {a.enlace && (
              <Link to={a.enlace} onClick={() => cerrar(a.id)}>
                {a.textoEnlace}
              </Link>
            )}
            <button type="button" className="boton-icono" onClick={() => cerrar(a.id)} aria-label="Cerrar aviso">
              <IconoCerrar />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAvisos() {
  return useContext(AvisosContext);
}

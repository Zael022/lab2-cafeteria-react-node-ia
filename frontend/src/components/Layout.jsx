// Estructura fija de todas las pantallas: menú lateral + contenido.
// El menú está agrupado por tareas para que siempre se sepa
// "en qué parte del negocio estoy".
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  IconoAsistente,
  IconoCerrar,
  IconoInsumos,
  IconoMenu,
  IconoPanel,
  IconoPedidos,
  IconoProductos,
  IconoVenta,
} from './Iconos.jsx';

const SECCIONES = [
  {
    titulo: 'Mostrador',
    enlaces: [
      { a: '/venta', texto: 'Nueva venta', Icono: IconoVenta },
      { a: '/pedidos', texto: 'Pedidos', Icono: IconoPedidos },
    ],
  },
  {
    titulo: 'Inventario',
    enlaces: [
      { a: '/productos', texto: 'Productos', Icono: IconoProductos },
      { a: '/insumos', texto: 'Insumos', Icono: IconoInsumos },
    ],
  },
  {
    titulo: 'Negocio',
    enlaces: [
      { a: '/', texto: 'Panel del día', Icono: IconoPanel, exacto: true },
      { a: '/asistente', texto: 'Asistente de compras', Icono: IconoAsistente },
    ],
  },
];

export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  // Al cambiar de vista, la página vuelve arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <a className="saltar" href="#contenido">Ir al contenido</a>

      <header className="barra-movil">
        <button
          type="button"
          className="boton-icono"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
        >
          <IconoMenu />
        </button>
        <span className="marca-texto">Mostrador</span>
      </header>

      <aside className={`menu ${menuAbierto ? 'menu--abierto' : ''}`} aria-label="Menú principal">
        <div className="menu__marca">
          <img src="/favicon.svg" alt="" width="36" height="36" />
          <div>
            <strong>Mostrador</strong>
            <span>Cafetería</span>
          </div>
          <button
            type="button"
            className="boton-icono menu__cerrar"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <IconoCerrar />
          </button>
        </div>

        <nav>
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo} className="menu__seccion">
              <p className="menu__titulo">{seccion.titulo}</p>
              <ul>
                {seccion.enlaces.map(({ a, texto, Icono, exacto }) => (
                  <li key={a}>
                    {/* NavLink marca solo el enlace de la sección actual (clase "active") */}
                    <NavLink to={a} end={exacto} className="menu__enlace" onClick={() => setMenuAbierto(false)}>
                      <Icono />
                      <span>{texto}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {menuAbierto && <div className="velo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      <main id="contenido" className="contenido">
        <Outlet />
      </main>
    </div>
  );
}

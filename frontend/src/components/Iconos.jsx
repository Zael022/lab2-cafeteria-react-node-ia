// Íconos simples en SVG (sin librerías). Todos usan currentColor,
// así toman el color del texto que los rodea.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconoPanel = () => (
  <svg {...base}><path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z" /></svg>
);
export const IconoVenta = () => (
  <svg {...base}><path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M9 3v3M13 3v3" /></svg>
);
export const IconoPedidos = () => (
  <svg {...base}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
);
export const IconoProductos = () => (
  <svg {...base}><path d="M4 7h16M6 7l1 13h10l1-13M9 7V5a3 3 0 0 1 6 0v2" /></svg>
);
export const IconoInsumos = () => (
  <svg {...base}><path d="M5 8h14v12H5zM3 4h18v4H3zM10 12h4" /></svg>
);
export const IconoAsistente = () => (
  <svg {...base}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" /></svg>
);
export const IconoMenu = () => (
  <svg {...base}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IconoCerrar = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconoMas = () => (
  <svg {...base} width={18} height={18}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconoMenos = () => (
  <svg {...base} width={18} height={18}><path d="M5 12h14" /></svg>
);
export const IconoBasura = () => (
  <svg {...base} width={18} height={18}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconoAlerta = () => (
  <svg {...base} width={18} height={18}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const IconoCheck = () => (
  <svg {...base} width={18} height={18}><path d="M5 12l5 5L20 7" /></svg>
);

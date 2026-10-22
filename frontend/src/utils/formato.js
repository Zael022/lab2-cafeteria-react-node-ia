// Funciones para mostrar números, dinero y fechas en formato de Costa Rica.

const colonesFmt = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const numeroFmt = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });
const fechaHoraFmt = new Intl.DateTimeFormat('es-CR', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const horaFmt = new Intl.DateTimeFormat('es-CR', { hour: 'numeric', minute: '2-digit' });
const diaFmt = new Intl.DateTimeFormat('es-CR', { weekday: 'short', day: 'numeric' });
const fechaLargaFmt = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** 2791.76 → "₡2 791,76" */
export const colones = (n) => colonesFmt.format(Number(n) || 0);

/** 2400 → "2 400" */
export const numero = (n) => numeroFmt.format(Number(n) || 0);

/** (12, "unidad") → "12 unidades"; (2400, "g") → "2 400 g" */
export function cantidad(n, unidad) {
  if (unidad === 'unidad') return `${numero(n)} ${Number(n) === 1 ? 'unidad' : 'unidades'}`;
  return `${numero(n)} ${unidad}`;
}

/** ISO en UTC → "21 oct, 10:30 a. m." en la hora local */
export const fechaHora = (iso) => (iso ? fechaHoraFmt.format(new Date(iso)) : '');
export const hora = (iso) => (iso ? horaFmt.format(new Date(iso)) : '');

/** "2026-10-21" → "mié 21" (sin correr el día por la zona horaria) */
export const diaCorto = (aaaammdd) => diaFmt.format(new Date(`${aaaammdd}T12:00:00`));
export const fechaLarga = (aaaammdd) => fechaLargaFmt.format(new Date(`${aaaammdd}T12:00:00`));

/** Fecha de hoy en formato AAAA-MM-DD según la hora local */
export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** "sinpe" → "SINPE Móvil" */
export const nombreMetodo = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', sinpe: 'SINPE Móvil' };

// npm run probar
// Ejecuta todos los casos de casos-prueba.js contra la API en marcha
// y muestra cuáles devolvieron el código HTTP esperado.
// Antes: npm run db:reset   y   npm run dev (en otra terminal)
import 'dotenv/config';
import { casos } from './casos-prueba.js';

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}/api`;
const variables = {};

function reemplazar(texto) {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, nombre) => variables[nombre] ?? `{{${nombre}}}`);
}

let pasaron = 0;
let fallaron = 0;
let carpetaActual = '';

for (const caso of casos) {
  if (caso.carpeta !== carpetaActual) {
    carpetaActual = caso.carpeta;
    console.log(`\n── ${carpetaActual} ──`);
  }

  const url = BASE + reemplazar(caso.ruta);
  const opciones = { method: caso.metodo, headers: {} };
  if (caso.body || caso.bodyRaw) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = caso.bodyRaw ?? reemplazar(JSON.stringify(caso.body));
  }

  let status;
  let datos;
  try {
    const respuesta = await fetch(url, opciones);
    status = respuesta.status;
    datos = await respuesta.json().catch(() => null);
  } catch (error) {
    console.error(`\n✘ No se pudo conectar a ${BASE}. ¿Está corriendo "npm run dev"?`);
    process.exit(1);
  }

  if (caso.guardar && datos) {
    for (const [variable, campo] of Object.entries(caso.guardar)) variables[variable] = datos[campo];
  }

  const ok = status === caso.esperado;
  ok ? pasaron++ : fallaron++;
  const detalle = datos?.error ? `  → ${datos.error}` : '';
  console.log(`${ok ? '✔' : '✘'} [${status}] ${caso.metodo.padEnd(6)} ${reemplazar(caso.ruta).padEnd(48)} ${caso.nombre}${ok ? detalle : `  (se esperaba ${caso.esperado})${detalle}`}`);
}

console.log(`\nResultado: ${pasaron} de ${casos.length} pruebas correctas${fallaron ? `, ${fallaron} fallaron` : ''}.`);
process.exit(fallaron ? 1 : 0);

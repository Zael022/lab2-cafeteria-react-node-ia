// npm run postman
// Genera ../../pruebas/cafeteria.postman_collection.json a partir de
// casos-prueba.js. La colección se importa en Postman o en Thunder
// Client (Collections → menú ≡ → Import → Postman).
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { casos } from './casos-prueba.js';

const destino = fileURLToPath(new URL('../../pruebas/cafeteria.postman_collection.json', import.meta.url));

function aItem(caso) {
  const tests = [
    `pm.test("Código ${caso.esperado}", () => pm.response.to.have.status(${caso.esperado}));`,
  ];
  if (caso.esperado >= 400) {
    tests.push('pm.test("Formato { error }", () => pm.expect(pm.response.json()).to.have.property("error"));');
  }
  for (const [variable, campo] of Object.entries(caso.guardar ?? {})) {
    tests.push(`pm.collectionVariables.set("${variable}", pm.response.json().${campo});`);
  }

  const request = {
    method: caso.metodo,
    header: [],
    url: { raw: `{{baseUrl}}${caso.ruta}` },
  };
  if (caso.body || caso.bodyRaw) {
    request.header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = {
      mode: 'raw',
      raw: caso.bodyRaw ?? JSON.stringify(caso.body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  return {
    name: `${caso.metodo} ${caso.nombre}`,
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }],
    request,
  };
}

const carpetas = [...new Set(casos.map((c) => c.carpeta))];

const coleccion = {
  info: {
    name: 'Cafetería · Laboratorio #2',
    description: 'Pruebas de la API (incluye 400, 404 y 409). Correr "npm run db:reset" antes de ejecutar la colección completa en orden.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api' },
    { key: 'insumoId', value: '' },
    { key: 'productoId', value: '' },
    { key: 'pedidoId', value: '' },
  ],
  item: carpetas.map((carpeta) => ({
    name: carpeta,
    item: casos.filter((c) => c.carpeta === carpeta).map(aItem),
  })),
};

await mkdir(fileURLToPath(new URL('../../pruebas/', import.meta.url)), { recursive: true });
await writeFile(destino, JSON.stringify(coleccion, null, 2) + '\n');
console.log(`✔ Colección generada en pruebas/cafeteria.postman_collection.json (${casos.length} peticiones)`);

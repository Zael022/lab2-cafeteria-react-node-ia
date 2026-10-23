# Bitácora de uso de IA

**Asistente:** Claude (Anthropic)
**Regla que sigo:** entiendo todo lo que pego, pruebo cada pieza antes de seguir y anoto aquí qué corregí o rechacé.

> El laboratorio pide al menos 5 prompts relevantes. Entradas 1 a 5: Día 1. Entradas 6 y 7: Día 2.

---

## Día 1 · Base de datos y API

### 1. Elegir el caso de negocio

**Prompt:**
> Te paso el enunciado del Laboratorio #2 (React + Node + BD + IA). ¿Qué caso me conviene para hacerlo sola en 12 horas y poder defenderlo?

**Qué devolvió la IA:**
Comparó los 5 casos según dificultad, reglas y peso en la rúbrica (lógica 25 %, agente 10 %). Recomendó el Caso 1 (cafetería) o el Caso 2 (restaurante) y descartó el 3 y el 4 por la cantidad de piezas para una sola persona.

**Qué decidí / corregí:**
Elegí el Caso 1. Verifiqué que no fuera el mismo caso que usé en el Laboratorio #1 (no se permite repetir).

---

### 2. Generar el esquema y la API del Día 1

**Prompt:**
> Armá el Día 1 completo del Caso 1: schema.sql con datos de ejemplo, API en Express por capas (routes, controllers, services), transacciones, códigos 200/201/400/404/409 con formato { error } y GET /api/resumen. Probalo antes de entregármelo.

**Qué devolvió la IA:**
- `schema.sql` con 5 tablas, llaves foráneas (`CASCADE` en recetas e items, `RESTRICT` en insumos y productos con ventas) y `CHECK` (precio > 0, stock ≥ 0, listas de valores).
- API por capas con un helper `withTransaction` para BEGIN / COMMIT / ROLLBACK.
- Reglas en los servicios: insumos suficientes por receta (409), anulación en 15 minutos (409), devolución de insumos, totales con 13 % calculados en el servidor.
- Script de 44 pruebas y colección de Postman generada a partir de esas pruebas.

**Qué corregí / rechacé:**
- Al correr las pruebas, un JSON mal formado devolvía 400 pero con el mensaje técnico de Express en inglés. Se movió esa validación antes en el manejador de errores para responder "El cuerpo de la petición no es un JSON válido".
- El mensaje de insumos faltantes decía "faltan 42 unidad"; se corrigió el plural.
- *(completar: lo que yo cambie al revisar el código)*

---

### 3. Cambiar de PostgreSQL a SQLite

**Prompt:**
> No tengo contraseña de PostgreSQL. Pasemos el proyecto a SQLite; voy a usar la extensión de alexcvzz en VS Code con su ejecutable.

**Qué devolvió la IA:**
La misma API convertida a SQLite. Cambios principales:
- `db.js`: la base es un archivo; se encienden las llaves foráneas (`PRAGMA foreign_keys = ON`), que en SQLite vienen apagadas.
- Transacciones con `BEGIN IMMEDIATE`, porque SQLite no tiene `SELECT ... FOR UPDATE`.
- Tipos: `BOOLEAN` → 0/1, fechas como texto ISO en UTC, `SERIAL` → `INTEGER PRIMARY KEY`.
- Consultas: `$1` → `?`, `ILIKE` → `LIKE`, `= ANY(...)` → `IN (SELECT value FROM json_each(?))`, `generate_series` → CTE recursivo.

**Qué corregí / rechacé:**
- Se intentó usar parámetros numerados (`?1` repetido) y la librería los rechazó con "Too many parameter values". Se reemplazó por un CTE `dia` que recibe la fecha una sola vez.
- *(completar)*

**Qué entendí:**
SQLite no es un servidor: la API abre el archivo directamente. La extensión de VS Code es solo un visor del mismo archivo, no la base de datos.

---

### 4. Error al instalar en Windows

**Prompt:**
> Al correr npm install me salió este error: (pegué la salida completa de la terminal, con "gyp ERR! find Python" y "node -v v24.21.0").

**Qué devolvió la IA:**
Explicó que `better-sqlite3` es una librería nativa (escrita en C): para Node 24.21 no encontró una versión ya compilada y trató de compilarla en mi computadora, lo que pide Python y Visual Studio Build Tools. Propuso cambiar a `node:sqlite`, el SQLite que viene incluido en Node 22.13+, para no tener que instalar nada.

**Qué corregí / rechacé:**
- Se descartó instalar Python + Build Tools: es más lento y podría fallar en otra compu el día de la presentación.
- Se cambió `nodemon` por `node --watch` (hace lo mismo y ya viene en Node).
- Los errores de restricciones ahora se identifican por `err.errcode` (787 llave foránea, 2067 único, 275 CHECK).
- Se volvieron a correr las 44 pruebas con Node 22 y con Node 24.
- *(completar)*

---

### 5. Probar las reglas más delicadas

**Prompt:**
> ¿Cómo compruebo que el descuento y la devolución de insumos cuadran, y que dos ventas al mismo tiempo no rompen el stock?

**Qué devolvió la IA:**
Una prueba manual: stock antes, crear pedido (2 capuchinos + 1 croissant), stock después, anular y stock otra vez. Más una prueba de concurrencia con 14 pedidos simultáneos de croissant cuando solo hay 12.

**Resultado (con SQLite):**
- Café 2400 → 2364 → 2400, leche 9000 → 8700 → 9000 (cuadra exacto).
- Total 5500 + 715 (13 %) = 6215.
- Concurrencia: 12 pedidos aceptados (201), 2 rechazados (409), stock final 0.
- Intento de inyección SQL en `?orden=` y `?q=`: ignorado, la tabla quedó intacta.

---

## Día 2 · Front en React y agente de IA

### 6. Diseñar y construir el front

**Prompt:**
> Hoy toca el frontend. Quiero que sea intuitivo, fácil de usar y que no se pierda el hilo de las cosas ni de dónde están. (Después le pasé dos páginas de referencia, cafeteriacastilla.com y cafedecostarica.com, y le dije que me gustaba más la segunda: su portada con partes translúcidas y la forma en que muestra la información.)

**Qué devolvió la IA:**
- Front completo con React Router (12 rutas), `services/api.js`, hooks `useFetch` y `useFiltrosURL`, formularios controlados con validación y manejo de 400/409, búsqueda/filtros/orden en tres listados y panel de métricas.
- Para "no perder el hilo": menú agrupado por tarea, migas de pan, avisos con enlace después de cada acción y filtros guardados en la URL.
- Estilo tomado de la referencia elegida: portada oscura con paneles de vidrio (`backdrop-filter`), fila de checks naranjas para explicar reglas, bloque de cifras para el cierre de caja y lista tipo línea de tiempo para los últimos 7 días.
- Probó todos los flujos en un navegador automatizado (Playwright) contra la API real, incluidos los 409, y en tamaño de celular.

**Qué corregí / rechacé:**
- La primera paleta (crema y terracota) se descartó por parecer genérica; luego se cambió al estilo de la referencia que elegí.
- No se copiaron la foto ni el logo de la referencia: el fondo de la portada es un patrón de granos de café dibujado en SVG.
- En las pruebas, un `<label>` que envolvía un `<select>` hacía que el lector de pantalla leyera "Insumo 1 Elegí un insumo…". Se cambió a etiquetas enlazadas con `htmlFor` + `useId`.
- El linter marcó `setState` dentro de `useEffect` en dos componentes; se reescribieron con el patrón recomendado por React.
- En computadora se veía el botón para cerrar el menú (solo debe salir en celular); se corrigió la especificidad del CSS.
- *(completar)*

---

### 7. Workflow de n8n con el agente de compras

**Prompt:**
> ¿El n8n ya está? Armá el workflow del agente: que lea los insumos bajo el mínimo y las ventas de la semana y proponga qué comprar, respondiendo con { ok, data, error } para el front.

**Qué devolvió la IA:**
- Workflow Webhook → AI Agent (Groq + herramienta HTTP `consultar_inventario` + Structured Output Parser) → Respond to Webhook, con una segunda salida de error que responde `{ ok: false, error }`.
- *System message* con las reglas de cálculo (consumo diario × días + mínimo − stock), prioridades y formato de justificación.
- Lo validó con el validador oficial de n8n y lo importó y ejecutó en un n8n 2.44 real. Como desde su entorno no hay acceso a Groq, para la prueba cambió el modelo por uno simulado: así comprobó el webhook, CORS, la llamada a la API, el formato y la pantalla del asistente.

**Qué corregí / rechacé:**
- El nodo "HTTP Request Tool" de LangChain que se usaba antes está oculto en n8n 2.x; se usó `httpRequestTool` (el nodo HTTP Request como herramienta).
- En n8n 2.x ya no se "activa" un workflow: se **publica** (botón Publish).
- Se activó "forzar uso de herramienta en la primera vuelta" para que el modelo no responda sin consultar el inventario.
- Al conectarlo con mi cuenta, n8n marcó el modelo `llama-3.3-70b-versatile` con advertencia: Groq lo retiró el 16/08/2026. Se cambió por `openai/gpt-oss-120b`, el reemplazo que recomienda Groq.
- Al importarlo, mi n8n mostró el nodo Webhook con "?" ("Install this node to use it"): la versión 2.2 del nodo era más nueva que mi n8n. Se bajó a la versión 2 del Webhook y 1.1 del Respond to Webhook, que existen desde hace más tiempo.
- *(completar: cómo respondió con mi credencial de Groq)*

---

### 8. Conectar el laboratorio a PostgreSQL en Docker

**Prompt:**
> Ya tengo Docker con PostgreSQL y pgAdmin web. ¿Cómo conecto el laboratorio para verlo ahí?

**Qué devolvió la IA:**
- Explicó que el laboratorio usaba SQLite (un archivo), por eso no aparecía en pgAdmin, y presentó ventajas y desventajas de migrar.
- Volvió a la versión de la API con `pg`: `Pool`, transacciones `BEGIN`/`COMMIT`/`ROLLBACK` y `SELECT ... FOR UPDATE` para ventas simultáneas.
- `npm run db:reset` crea la base `cafeteria` si no existe dentro de mi PostgreSQL y carga `schema.sql`.
- Agregó un `docker-compose.yml` propio del repo (puertos 5433 y 5051) para quien clone el proyecto sin tener mi Docker.
- Repitió las 44 pruebas, la de concurrencia y el recorrido completo del front: todo igual que con SQLite.

**Qué corregí / rechacé:**
- Se descartó levantar un segundo PostgreSQL en mi compu: uso el mío y solo cambio `DATABASE_URL` en `.env`.
- *(completar)*


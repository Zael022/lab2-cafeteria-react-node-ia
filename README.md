# Cafetería · Punto de venta e inventario por recetas

Laboratorio #2 — Desarrollo Front End (React + Node.js + Base de datos + IA)
Proyecto individual · Caso 1: **Punto de venta e inventario de una cafetería**

La cafetería controla su inventario por **insumos**: cada producto tiene una **receta** (un capuchino usa 18 g de café, 150 ml de leche y 1 vaso). Cada venta descuenta los insumos de la receta, se registra el método de pago y se genera el cierre de caja del día.

> **Estado:** ✅ Base de datos + API · ✅ Front en React · ✅ Agente de IA en n8n

**Stack:** Node.js + Express 5 · PostgreSQL 16 (en Docker) · React (Vite) + React Router · n8n con AI Agent

---

## Estructura del repositorio

```
lab2-cafeteria/
├── docker-compose.yml         # PostgreSQL + pgAdmin (puertos 5433 y 5051)
├── pgadmin/servers.json       # Servidor ya registrado en pgAdmin
├── schema.sql                 # Tablas, llaves, restricciones y datos de ejemplo
├── backend/                   # API REST (Node.js + Express 5 + PostgreSQL)
│   ├── src/
│   │   ├── routes/            # Definen las rutas REST
│   │   ├── controllers/       # Reciben la petición y responden
│   │   ├── services/          # Reglas de negocio y consultas a la BD
│   │   ├── middlewares/       # Manejo central de errores
│   │   ├── utils/             # Validaciones, errores HTTP y constantes
│   │   ├── db.js              # Pool de pg + helper de transacciones
│   │   ├── app.js             # Configuración de Express
│   │   └── server.js          # Arranque
│   ├── scripts/               # db:reset, pruebas y generador de la colección
│   └── .env.example
├── n8n/
│   ├── sugerencia-compra.workflow.json   # Workflow exportado sin credenciales
│   └── README.md
├── pruebas/
│   └── cafeteria.postman_collection.json   # 44 peticiones (Postman / Thunder Client)
├── frontend/                  # React (Vite) + React Router
│   └── src/
│       ├── services/api.js    # TODAS las peticiones (API y n8n)
│       ├── hooks/             # useFetch, useFiltrosURL
│       ├── components/        # Piezas reutilizables (lista, item, formulario, métricas, errores…)
│       ├── pages/             # Una vista por ruta
│       ├── utils/             # Formato de colones/fechas y constantes
│       └── index.css          # Estilos y variables de color
├── BITACORA_IA.md
└── README.md
```

---

## Diagrama entidad-relación

```mermaid
erDiagram
    PRODUCTOS ||--o{ RECETAS : "se prepara con"
    INSUMOS   ||--o{ RECETAS : "se usa en"
    PEDIDOS   ||--o{ PEDIDO_ITEMS : "contiene"
    PRODUCTOS ||--o{ PEDIDO_ITEMS : "se vende en"

    INSUMOS {
        int id PK
        text nombre "UNIQUE, NOT NULL"
        text unidad "g | ml | unidad"
        numeric stock "CHECK >= 0"
        numeric stock_minimo "CHECK >= 0"
    }
    PRODUCTOS {
        int id PK
        text nombre "UNIQUE, NOT NULL"
        numeric precio "CHECK > 0"
        text categoria "4 categorías"
        boolean activo
    }
    RECETAS {
        int id PK
        int producto_id FK "ON DELETE CASCADE"
        int insumo_id FK "ON DELETE RESTRICT"
        numeric cantidad "CHECK > 0"
    }
    PEDIDOS {
        int id PK
        timestamptz fecha
        text metodo_pago "efectivo | tarjeta | sinpe"
        numeric subtotal
        numeric impuesto
        numeric total
        text estado "confirmado | anulado"
        timestamptz fecha_anulacion
    }
    PEDIDO_ITEMS {
        int id PK
        int pedido_id FK "ON DELETE CASCADE"
        int producto_id FK "ON DELETE RESTRICT"
        int cantidad "CHECK > 0"
        numeric precio_unitario "precio del momento"
    }
```

`recetas` es la tabla intermedia entre `productos` e `insumos` (relación muchos a muchos con un dato extra: la cantidad).

---

## Cómo levantar el proyecto

### Requisitos
- Node.js 20 o superior (`node -v`).
- **Docker Desktop** encendido, con PostgreSQL corriendo (el tuyo o el de este repo, ver abajo).

### 1. Base de datos (PostgreSQL en Docker)

Hay dos formas. Elegí **una**:

**A) Usar un PostgreSQL que ya tenés en Docker** (por ejemplo en el puerto 5432):
1. Copiá `backend/.env.example` como `backend/.env` y poné tus datos en `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://TU_USUARIO:TU_CONTRASEÑA@localhost:5432/cafeteria
   ```
   Usuario y contraseña son los de `POSTGRES_USER` y `POSTGRES_PASSWORD` de tu docker-compose.
2. Crear la base `cafeteria` y cargar los datos:
   ```bash
   cd backend
   npm install
   npm run db:reset
   ```

**B) Usar el `docker-compose.yml` de este repo** (PostgreSQL en el 5433 y pgAdmin en el 5051):
```bash
docker compose up -d          # en la raíz del repo; la primera vez carga schema.sql solo
cd backend
cp .env.example .env          # en Windows: copy .env.example .env  (ya apunta al 5433)
npm install
```

En los dos casos, `npm run db:reset` vuelve a los datos de ejemplo cuando haga falta.

### 2. API

```bash
cd backend
npm run dev        # API en http://localhost:3000/api (se reinicia sola al guardar)
```

Si dice *"No se pudo conectar a PostgreSQL"*: Docker está apagado o `DATABASE_URL` tiene mal el usuario, la contraseña o el puerto.

### Ver la base en pgAdmin
- **Con tu propio pgAdmin:** en tu servidor → clic derecho en **Databases → Refresh** → aparece `cafeteria` → **Schemas → public → Tables**. Clic derecho en una tabla → **View/Edit Data → All Rows**.
- **Con el del repo (opción B):** http://localhost:5051 → **Cafetería (lab 2)** (contraseña `postgres`).
- Extra para la demo: clic derecho en la base → **ERD For Database** dibuja el diagrama desde la base.

### 3. Probar la API

Con la API corriendo, en otra terminal:

```bash
npm run db:reset   # partir de datos limpios
npm run probar     # 44 pruebas: muestra ✔ / ✘ y el código HTTP de cada una
```

Para Postman o Thunder Client: importar `pruebas/cafeteria.postman_collection.json` y ejecutar la colección en orden. Cada petición verifica su código HTTP y las de error verifican el formato `{ error }`.

### 4. Front (React)

Con la API corriendo, en otra terminal:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Opcional: copiar `frontend/.env.example` como `.env` para cambiar la dirección de la API o del webhook de n8n.

### 5. Agente de IA (n8n)

1. `npx n8n` y abrir http://localhost:5678.
2. Importar `n8n/sugerencia-compra.workflow.json`.
3. En el nodo **Groq Chat Model**, elegir la credencial de Groq.
4. **Publish**.

Detalle completo, diagrama del workflow y problemas comunes en [`n8n/README.md`](n8n/README.md).

**Contrato:** el front manda `{ dias_a_cubrir, nota }` a `http://localhost:5678/webhook/sugerencia-compra` y recibe `{ ok, data: { resumen, compras: [{ insumo, cantidad, unidad, prioridad, justificacion }] }, error }`. El agente usa la API como herramienta (`GET /api/resumen/compras`) para leer el inventario y el consumo real de la semana.

---

## Front en React

### Vistas (React Router)
| Ruta | Vista | Qué se hace ahí |
|---|---|---|
| `/` | Panel del día | Indicadores, cierre de caja por forma de pago, top 5, últimos 7 días (consume `/api/resumen`) |
| `/venta` | Nueva venta | Elegir productos, forma de pago y cobrar (`POST /api/pedidos`) |
| `/pedidos` | Pedidos | Listado con filtro por día, estado, forma de pago y orden |
| `/pedidos/:id` | Detalle de pedido | Productos del pedido y anulación con confirmación |
| `/productos` | Productos | Búsqueda, filtro por categoría y disponibilidad, orden |
| `/productos/nuevo` · `/productos/:id/editar` | Formulario | Crear / editar con receta |
| `/productos/:id` | Detalle | Receta con stock de cada insumo, cuál lo limita, unidades vendidas, eliminar |
| `/insumos` | Insumos | Búsqueda, filtro "bajo el mínimo", orden por urgencia |
| `/insumos/nuevo` · `/insumos/:id/editar` | Formulario | Crear / reabastecer |
| `/insumos/:id` | Detalle | Stock contra mínimo y productos que lo usan |
| `/asistente` | Asistente de compras | Llama al agente de n8n y muestra la sugerencia |
| `*` | No encontrada | Página 404 con salidas |

### Cómo cumple los requisitos
- **Capa de servicios:** `src/services/api.js` hace todas las peticiones; si la API responde error, lanza un `ApiError` con el mensaje de `{ error }` y el código HTTP.
- **Custom hooks:** `useFetch` maneja `cargando`, `error` y `datos` (y descarta respuestas viejas si cambian los filtros rápido). `useFiltrosURL` guarda búsqueda, filtros y orden en la URL.
- **Formularios controlados:** producto (con receta editable) e insumo. Validan en el cliente con las mismas reglas que la API y muestran los errores 400/409 que devuelve el servidor.
- **Búsqueda, filtros y orden:** en Productos, Insumos y Pedidos. El buscador espera 300 ms antes de consultar.
- **Eliminar con confirmación:** ventana `<dialog>`; si la API responde 409, el error aparece dentro de la misma ventana con una salida (por ejemplo "Desactivar en su lugar").
- **Componentes reutilizables:** `ListaProductos`/`ItemProducto`, `ListaInsumos`/`ItemInsumo`, `FormularioProducto`, `FormularioInsumo`, `TarjetaMetrica`, `MensajeError`, `Cargando`, `Vacio`, `Ticket`, `GraficoBarras`, `DialogoConfirmar`, `Portada`, `ListaChecks`…

### Para no perder el hilo
- Menú lateral fijo agrupado por tarea (Mostrador, Inventario, Negocio); la sección actual se marca con una barra naranja.
- Migas de pan en cada vista ("Inventario / Productos / Capuchino / Editar") y el título de la pestaña cambia con la vista.
- Después de guardar se va al detalle de lo guardado y aparece un aviso con enlace ("Pedido #23 cobrado · Ver pedido").
- Los filtros viven en la URL: al volver atrás desde un detalle, la lista sigue igual.
- Todo está enlazado: un insumo muestra los productos que lo usan, un producto su receta, un pedido sus productos, y el panel lleva a los pedidos o insumos filtrados.

### Diseño
Inspirado en el estilo de [cafedecostarica.com](https://www.cafedecostarica.com/) (sin usar su marca ni sus imágenes): verde bosque, naranja como acento, títulos en azul tinta con Montserrat y texto en Plus Jakarta Sans. Las pantallas de "Negocio" abren con una portada oscura con granos de café dibujados en SVG y paneles de vidrio translúcido (`backdrop-filter: blur`). El resto es sobrio para trabajar rápido. Funciona en celular (menú desplegable).

### Cómo mostrar un 409 desde la pantalla (para la demo)
- **Nueva venta:** agregar 8 Croissant + 8 Croissant jamón y queso. Cada uno alcanza por separado (12), pero juntos necesitan 16 croissants → la API responde 409 y el tiquete lo explica.
- **Eliminar un producto con ventas** (por ejemplo Capuchino) → 409 dentro de la ventana de confirmación.
- **Crear un producto con un nombre que ya existe** → 409 arriba del formulario.
- **Eliminar un insumo que está en una receta** → 409.

---

## Endpoints

Base: `http://localhost:3000/api`

### Insumos (CRUD completo)
| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/insumos` | Lista. Filtros: `?q=` texto, `?bajo_minimo=true`, `?orden=nombre\|stock\|faltante&dir=asc\|desc` | 200, 400 |
| GET | `/insumos/:id` | Insumo + productos que lo usan | 200, 400, 404 |
| POST | `/insumos` | Crea `{ nombre, unidad, stock, stock_minimo }` | 201, 400, 409 |
| PUT | `/insumos/:id` | Reemplaza todos los campos (reabastecer) | 200, 400, 404, 409 |
| DELETE | `/insumos/:id` | Elimina si no está en ninguna receta | 200, 404, 409 |

### Productos (CRUD completo, con receta)
| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/productos` | Lista con `porciones_disponibles` y `disponible`. Filtros: `?q=`, `?categoria=`, `?activo=`, `?disponible=`, `?orden=nombre\|precio\|categoria\|porciones&dir=` | 200, 400 |
| GET | `/productos/:id` | Producto + receta (con stock de cada insumo) + unidades vendidas | 200, 400, 404 |
| POST | `/productos` | Crea `{ nombre, precio, categoria, activo?, receta: [{ insumo_id, cantidad }] }` | 201, 400, 409 |
| PUT | `/productos/:id` | Reemplaza datos y receta completa | 200, 400, 404, 409 |
| DELETE | `/productos/:id` | Elimina si no tiene ventas | 200, 404, 409 |

### Pedidos
| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| GET | `/pedidos` | Lista. Filtros: `?fecha=AAAA-MM-DD`, `?estado=`, `?metodo_pago=` | 200, 400 |
| GET | `/pedidos/:id` | Pedido + items + `se_puede_anular` y `minutos_para_anular` | 200, 400, 404 |
| POST | `/pedidos` | Crea y confirma `{ metodo_pago, items: [{ producto_id, cantidad }] }` | 201, 400, 409 |
| PATCH | `/pedidos/:id/anular` | Anula y devuelve los insumos | 200, 400, 404, 409 |

### Métricas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/resumen?fecha=AAAA-MM-DD` | Cierre de caja (sin fecha = hoy): totales, total por método de pago, top 5 productos, pedidos por estado, ventas de los últimos 7 días, cantidad de insumos bajo mínimo |
| GET | `/resumen/compras` | Insumos bajo mínimo, consumo real de 7 días y días de cobertura (lo usará el agente de IA) |

Todas las respuestas de error tienen el formato `{ "error": "mensaje" }`.

---

## Reglas de negocio implementadas

Todas se validan **en el servidor** (`backend/src/services/`), aunque el front también las muestre.

| # | Regla | Dónde | Código si falla |
|---|---|---|---|
| 1 | Total = Σ precio × cantidad + 13 % de impuesto. Lo calcula el servidor; el front nunca manda precios ni totales | `pedidos.service.js → crear` | — |
| 2 | El precio se copia en `pedido_items.precio_unitario` para conservar el histórico | `pedidos.service.js → crear` | — |
| 3 | Un pedido solo se acepta si hay insumos suficientes para **todas** sus recetas juntas (2 capuchinos + 1 latte suman la leche de los tres) | `pedidos.service.js → crear` | 409 |
| 4 | Confirmar un pedido descuenta los insumos dentro de una transacción | `pedidos.service.js → crear` | — |
| 5 | Solo se puede anular en los primeros 15 minutos, y no dos veces | `pedidos.service.js → anular` | 409 |
| 6 | Al anular se devuelven los insumos (transacción) | `pedidos.service.js → anular` | — |
| 7 | Cierre de caja: total del día por método de pago y top 5 productos | `resumen.service.js` | — |
| 8 | No se vende un producto inactivo | `pedidos.service.js → crear` | 409 |
| 9 | No se elimina un insumo que está en una receta | `insumos.service.js → eliminar` | 409 |
| 10 | No se elimina un producto con ventas (se desactiva) | `productos.service.js → eliminar` | 409 |
| 11 | Nombres de insumo y producto únicos | `*.service.js → verificarNombreLibre` | 409 |
| 12 | Un producto necesita receta con al menos un insumo existente | `productos.service.js → validarDatos` | 400 |

### Transacciones (BEGIN / COMMIT / ROLLBACK)
`db.js` tiene un helper `withTransaction` que se usa en toda operación que modifica varias tablas:
- **Crear pedido:** `pedidos` + `pedido_items` + `insumos`
- **Anular pedido:** `pedidos` + `insumos`
- **Crear / editar producto:** `productos` + `recetas`

Si cualquier paso lanza un error, se hace `ROLLBACK` y no queda nada a medias.

### Ventas simultáneas
Al crear un pedido, los insumos se leen con `SELECT ... FOR UPDATE`. Si dos cajeros venden el último croissant al mismo tiempo, el segundo espera a que el primero termine y luego ve el stock ya descontado, así que recibe 409 en lugar de dejar el stock en negativo. Probado: 14 pedidos simultáneos con 12 croissants → 12 aceptados, 2 rechazados con 409, stock final 0. Como red de seguridad extra, la tabla tiene `CHECK (stock >= 0)`.

---

## Seguridad

- Credenciales solo en `backend/.env` (no se sube: está en `.gitignore`, junto con `node_modules`).
- **Todas** las consultas son parametrizadas (`$1, $2...`); nunca se concatena lo que manda el cliente.
- `ORDER BY` no admite parámetros, así que el criterio de orden se toma de una **lista blanca** (`ORDENES`); cualquier otro valor se ignora.
- Los errores 500 no muestran detalles internos al cliente (solo se registran en la consola del servidor).
- CORS limitado al origen del front (`CORS_ORIGIN`).

---

## Decisiones y limitaciones conocidas

- **PostgreSQL en Docker.** El enunciado lo recomienda. La API se probó primero con PostgreSQL, pasó a SQLite cuando no había un servidor disponible (en Windows la librería `better-sqlite3` pedía compilarse) y volvió a PostgreSQL cuando estuvo Docker. Ver la bitácora.
- **Crear = confirmar.** En un punto de venta el pedido se cobra al momento, así que `POST /pedidos` crea el pedido ya confirmado y descuenta los insumos en la misma transacción.
- **Zona horaria.** Cada conexión usa `America/Costa_Rica` (configurable con `TIMEZONE` en `.env`), para que "hoy" en el cierre de caja sea el día local y no el de UTC.
- **Montos.** `NUMERIC(10,2)` en la base; `db.js` los convierte a número para que el JSON tenga `2000` y no `"2000.00"`.
- **Devolución al anular.** Se calcula con la receta actual del producto. Si alguien cambiara la receta dentro de esos 15 minutos, la devolución usaría la receta nueva. Para eliminar ese caso habría que guardar el consumo de cada venta en una tabla aparte.
- **Datos de ejemplo.** Las fechas de los pedidos son relativas al momento de cargar el schema, así que el panel siempre tiene ventas de "esta semana". Tres insumos (chocolate, croissant y vaso frío) quedan a propósito bajo el mínimo para el agente de IA.

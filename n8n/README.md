# Workflow de n8n · Sugerencia de compra

`sugerencia-compra.workflow.json` es el workflow exportado **sin credenciales**. Probado con n8n 2.44 (Node 24).

## Qué hace

```
Webhook (POST /webhook/sugerencia-compra)
   └─► Agente de compras (AI Agent)
         ├─ modelo: Groq Chat Model (openai/gpt-oss-120b)
         ├─ herramienta: consultar_inventario → GET http://localhost:3000/api/resumen/compras
         └─ formato: Structured Output Parser → { resumen, compras: [...] }
   ├─► (salió bien)  Responder sugerencia → 200 { ok: true,  data, error: null }
   └─► (falló)       Responder error      → 502 { ok: false, data: null, error }
```

- El front manda `{ dias_a_cubrir, nota }`.
- El agente **llama a la herramienta** para leer el inventario y el consumo real de la semana (no inventa datos) y calcula las cantidades con las reglas del *system message*.
- Si algo falla (API apagada, credencial inválida, respuesta mal formada), el nodo del agente tiene **On Error → Continue (using error output)**, así que el front siempre recibe el contrato `{ ok, data, error }`.

## Cómo dejarlo funcionando

1. Levantá n8n: `npx n8n` y abrí http://localhost:5678.
2. **Workflows → Import from File** (o el menú `…` → *Import from file*) y elegí `sugerencia-compra.workflow.json`.
3. Abrí el nodo **Groq Chat Model** → *Credential* → elegí tu credencial de Groq (la misma del Laboratorio #1) o creá una nueva con tu API key.
   - Groq retiró `llama-3.3-70b-versatile` el 16/08/2026; su reemplazo recomendado es `openai/gpt-oss-120b`. Si tampoco aparece, elegí otro modelo de Groq que soporte herramientas (tool calling).
4. Guardá y presioná **Publish** (arriba a la derecha). Sin publicar, el webhook de producción no responde.
5. Con la API (`backend`) y el front corriendo, andá a **Asistente de compras** y presioná *Pedir sugerencia*.

## Probar sin el front

```bash
curl -X POST http://localhost:5678/webhook/sugerencia-compra \
  -H "Content-Type: application/json" \
  -d '{"dias_a_cubrir": 7, "nota": ""}'
```

## Problemas comunes

| Lo que ves | Qué revisar |
|---|---|
| "No hay conexión con n8n" en el front | n8n no está corriendo (`npx n8n`) |
| El nodo Webhook sale con "?" | Tu n8n es más viejo que la versión del nodo: borralo, agregá un Webhook nuevo (POST, path `sugerencia-compra`, Respond: *Using 'Respond to Webhook' Node*) y conectalo al agente |
| 404 al llamar el webhook | El workflow no está publicado (botón **Publish**) |
| `{ ok: false, error: "...credentials..." }` | Falta elegir la credencial de Groq en el nodo del modelo |
| `{ ok: false }` y el agente no tiene datos | La API no está corriendo en el puerto 3000 |

## Para exportarlo de nuevo (entrega)

Menú `…` del workflow → **Download**. n8n exporta solo la referencia a la credencial (nombre e id), nunca la API key. Aun así, antes de subirlo revisá que el JSON no tenga ninguna clave escrita a mano.

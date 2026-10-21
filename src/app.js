// Configuración de Express (separada de server.js para poder probarla
// sin levantar el puerto).
import express from 'express';
import cors from 'cors';
import rutas from './routes/index.js';
import { errorHandler, rutaNoEncontrada } from './middlewares/errorHandler.js';

const app = express();

// Solo el front (Vite) puede llamar a la API desde el navegador
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', rutas);

// Siempre al final: primero 404 de rutas, luego el manejador de errores
app.use(rutaNoEncontrada);
app.use(errorHandler);

export default app;

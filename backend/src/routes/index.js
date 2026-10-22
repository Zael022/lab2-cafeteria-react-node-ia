// Junta todas las rutas bajo /api
import { Router } from 'express';
import insumos from './insumos.routes.js';
import productos from './productos.routes.js';
import pedidos from './pedidos.routes.js';
import resumen from './resumen.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.use('/insumos', insumos);
router.use('/productos', productos);
router.use('/pedidos', pedidos);
router.use('/resumen', resumen);

export default router;

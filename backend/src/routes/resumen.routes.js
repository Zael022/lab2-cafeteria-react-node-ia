import { Router } from 'express';
import * as c from '../controllers/resumen.controller.js';

const router = Router();

router.get('/', c.resumen);          // cierre de caja + indicadores
router.get('/compras', c.compras);   // datos para el agente de IA

export default router;

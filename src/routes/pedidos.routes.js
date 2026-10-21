import { Router } from 'express';
import * as c from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/', c.listar);
router.get('/:id', c.obtener);
router.post('/', c.crear);               // crea y confirma (descuenta insumos)
router.patch('/:id/anular', c.anular);   // solo en los primeros 15 min

export default router;

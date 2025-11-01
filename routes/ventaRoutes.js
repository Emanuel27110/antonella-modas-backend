import express from 'express';
import {
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta,
  eliminarVenta,
  obtenerEstadisticas,
  obtenerVentasPorPeriodo
} from '../controllers/ventaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas están protegidas (solo admin)
router.get('/', protect, obtenerVentas);
router.get('/estadisticas', protect, obtenerEstadisticas);
router.get('/estadisticas/periodo', protect, obtenerVentasPorPeriodo);
router.get('/:id', protect, obtenerVentaPorId);
router.post('/', protect, crearVenta);
router.delete('/:id', protect, eliminarVenta);

export default router;
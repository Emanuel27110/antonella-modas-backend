import express from 'express';
import {
  obtenerResumen,
  obtenerVentasDelDia,
  obtenerVentasDeLaSemana,
  obtenerVentasDelMes,
  obtenerPorMetodoPago,
  obtenerTopProductos
} from '../controllers/cajaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas están protegidas (solo admin)
router.get('/resumen', protect, obtenerResumen);
router.get('/dia', protect, obtenerVentasDelDia);
router.get('/semana', protect, obtenerVentasDeLaSemana);
router.get('/mes', protect, obtenerVentasDelMes);
router.get('/metodos-pago', protect, obtenerPorMetodoPago);
router.get('/top-productos', protect, obtenerTopProductos);

export default router;
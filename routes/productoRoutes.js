import express from 'express';
import { 
  obtenerProductos,
  obtenerProductosPorCategoria,
  obtenerTodosLosProductos,
  obtenerProductoPorId,
  obtenerProductosStockBajo, // 🆕 NUEVO
  crearProducto,
  actualizarProducto,
  actualizarStock, // 🆕 NUEVO
  eliminarProducto,
  cambiarVisibilidad
} from '../controllers/productoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (SIN mostrar stock)
router.get('/', obtenerProductos);
router.get('/categoria/:id', obtenerProductosPorCategoria);
router.get('/:id', obtenerProductoPorId);

// Rutas protegidas (admin) - CON stock
router.get('/admin/todos', protect, obtenerTodosLosProductos);
router.get('/admin/stock-bajo', protect, obtenerProductosStockBajo); // 🆕 NUEVO
router.post('/', protect, crearProducto);
router.put('/:id', protect, actualizarProducto);
router.patch('/:id/stock', protect, actualizarStock); // 🆕 NUEVO
router.delete('/:id', protect, eliminarProducto);
router.patch('/:id/visibilidad', protect, cambiarVisibilidad);

export default router;
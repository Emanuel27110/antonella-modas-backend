import express from 'express';
import {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  actualizarEstadoPago,
  eliminarPedido,
  obtenerEstadisticas
} from '../controllers/pedidoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/', crearPedido); // Crear pedido (clientes)

// Rutas protegidas (Admin)
router.get('/', protect, obtenerPedidos); // Listar todos
router.get('/estadisticas', protect, obtenerEstadisticas); // Estadísticas
router.get('/:id', protect, obtenerPedidoPorId); // Ver detalle
router.patch('/:id/estado', protect, actualizarEstadoPedido); // Cambiar estado
router.patch('/:id/pago', protect, actualizarEstadoPago); // Cambiar estado de pago
router.delete('/:id', protect, eliminarPedido); // Eliminar

export default router;
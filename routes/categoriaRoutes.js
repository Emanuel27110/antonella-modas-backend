import express from 'express';
import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from '../controllers/categoriaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', obtenerCategorias);
router.get('/:id', obtenerCategoriaPorId);

// Rutas protegidas (admin)
router.post('/', protect, crearCategoria);
router.put('/:id', protect, actualizarCategoria);
router.delete('/:id', protect, eliminarCategoria);

export default router;
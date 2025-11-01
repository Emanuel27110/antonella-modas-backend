import express from 'express';
import { 
  registrarUsuario, 
  loginUsuario, 
  obtenerPerfil 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);

// Rutas protegidas
router.get('/perfil', protect, obtenerPerfil);

export default router;
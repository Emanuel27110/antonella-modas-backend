import express from 'express';
import { subirImagen } from '../controllers/uploadController.js';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, upload.single('imagen'), subirImagen);

export default router;
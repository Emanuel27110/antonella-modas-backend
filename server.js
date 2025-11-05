import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import connectDB from './config/db.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import cajaRoutes from './routes/cajaRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js'; // 🆕 NUEVO

connectDB();

const app = express();

// Configurar CORS para permitir peticiones desde el frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ mensaje: '🚀 API de Antonella Modas funcionando correctamente!' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pedidos', pedidoRoutes); // 🆕 NUEVO

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📦 Sistema de stock: ACTIVO`);
  console.log(`💰 Sistema de ventas presenciales: ACTIVO`);
  console.log(`🛒 Sistema de pedidos online: ACTIVO`); // 🆕 NUEVO
  console.log(`💵 Sistema de caja: ACTIVO`);
  console.log(`☁️  Cloudinary: ACTIVO`);
});
import Usuario from '../models/Usuario.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Registrar nuevo usuario (solo para crear el primer admin)
// @route   POST /api/auth/register
// @access  Público (luego lo podemos proteger)
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password
    });

    if (usuario) {
      res.status(201).json({
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: generateToken(usuario._id)
      });
    } else {
      res.status(400).json({ mensaje: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Público
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email });

    // Verificar usuario y password
    if (usuario && (await usuario.matchPassword(password))) {
      res.json({
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: generateToken(usuario._id)
      });
    } else {
      res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener perfil del usuario
// @route   GET /api/auth/perfil
// @access  Privado
export const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select('-password');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
};
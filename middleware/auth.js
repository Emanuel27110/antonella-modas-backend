import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const protect = async (req, res, next) => {
  let token;

  // Verificar si viene el token en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener el token
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener el usuario del token (sin la password)
      req.usuario = await Usuario.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ 
        mensaje: 'No autorizado, token inválido' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      mensaje: 'No autorizado, no hay token' 
    });
  }
};

// Función para generar token JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};
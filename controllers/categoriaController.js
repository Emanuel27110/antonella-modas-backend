import Categoria from '../models/Categoria.js';

// @desc    Obtener todas las categorías
// @route   GET /api/categorias
// @access  Público
export const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ orden: 1, createdAt: -1 });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
  }
};

// @desc    Obtener una categoría por ID
// @route   GET /api/categorias/:id
// @access  Público
export const obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categoría', error: error.message });
  }
};

// @desc    Crear nueva categoría
// @route   POST /api/categorias
// @access  Privado/Admin
export const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, orden } = req.body;

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      orden
    });

    res.status(201).json(categoria);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ mensaje: 'Error al crear categoría', error: error.message });
  }
};

// @desc    Actualizar categoría
// @route   PUT /api/categorias/:id
// @access  Privado/Admin
export const actualizarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    const { nombre, descripcion, orden } = req.body;

    categoria.nombre = nombre || categoria.nombre;
    categoria.descripcion = descripcion !== undefined ? descripcion : categoria.descripcion;
    categoria.orden = orden !== undefined ? orden : categoria.orden;

    const categoriaActualizada = await categoria.save();
    res.json(categoriaActualizada);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar categoría', error: error.message });
  }
};

// @desc    Eliminar categoría
// @route   DELETE /api/categorias/:id
// @access  Privado/Admin
export const eliminarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    await categoria.deleteOne();
    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría', error: error.message });
  }
};
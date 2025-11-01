import Producto from '../models/Producto.js';

// @desc    Obtener todos los productos visibles (para clientes) - SIN MOSTRAR STOCK
// @route   GET /api/productos
// @access  Público
export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ visible: true })
      .populate('categoria', 'nombre')
      .select('-stock -stockMinimo') // 🆕 OCULTAR campos de stock
      .sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// @desc    Obtener productos por categoría (visibles) - SIN MOSTRAR STOCK
// @route   GET /api/productos/categoria/:id
// @access  Público
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const productos = await Producto.find({ 
      categoria: req.params.id,
      visible: true 
    })
      .populate('categoria', 'nombre')
      .select('-stock -stockMinimo') // 🆕 OCULTAR campos de stock
      .sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// @desc    Obtener TODOS los productos (para admin, incluyendo ocultos) - CON STOCK
// @route   GET /api/productos/admin/todos
// @access  Privado/Admin
export const obtenerTodosLosProductos = async (req, res) => {
  try {
    const productos = await Producto.find()
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// @desc    Obtener un producto por ID - SIN MOSTRAR STOCK (público)
// @route   GET /api/productos/:id
// @access  Público
export const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoria', 'nombre')
      .select('-stock -stockMinimo'); // 🆕 OCULTAR campos de stock
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    res.json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
  }
};

// 🆕 NUEVO: Obtener productos con stock bajo
// @desc    Obtener productos con stock bajo o agotado
// @route   GET /api/productos/admin/stock-bajo
// @access  Privado/Admin
export const obtenerProductosStockBajo = async (req, res) => {
  try {
    const productos = await Producto.find()
      .populate('categoria', 'nombre')
      .sort({ stock: 1 }); // Ordenar por stock ascendente

    // Filtrar productos donde stock <= stockMinimo
    const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo);

    res.json({
      total: productosStockBajo.length,
      productos: productosStockBajo
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos con stock bajo', error: error.message });
  }
};

// @desc    Crear nuevo producto - CON STOCK
// @route   POST /api/productos
// @access  Privado/Admin
export const crearProducto = async (req, res) => {
  try {
    const { 
      nombre, 
      precio, 
      stock, // 🆕 NUEVO
      stockMinimo, // 🆕 NUEVO
      talles, 
      imagen, 
      descripcion, 
      categoria, 
      visible 
    } = req.body;

    const producto = await Producto.create({
      nombre,
      precio,
      stock: stock !== undefined ? stock : 0, // 🆕 NUEVO
      stockMinimo: stockMinimo !== undefined ? stockMinimo : 5, // 🆕 NUEVO
      talles,
      imagen,
      descripcion,
      categoria,
      visible: visible !== undefined ? visible : true
    });

    const productoConCategoria = await Producto.findById(producto._id)
      .populate('categoria', 'nombre');
    res.status(201).json(productoConCategoria);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
  }
};

// @desc    Actualizar producto - CON STOCK
// @route   PUT /api/productos/:id
// @access  Privado/Admin
export const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const { 
      nombre, 
      precio, 
      stock, // 🆕 NUEVO
      stockMinimo, // 🆕 NUEVO
      talles, 
      imagen, 
      descripcion, 
      categoria, 
      visible 
    } = req.body;

    producto.nombre = nombre || producto.nombre;
    producto.precio = precio !== undefined ? precio : producto.precio;
    producto.stock = stock !== undefined ? stock : producto.stock; // 🆕 NUEVO
    producto.stockMinimo = stockMinimo !== undefined ? stockMinimo : producto.stockMinimo; // 🆕 NUEVO
    producto.talles = talles !== undefined ? talles : producto.talles;
    producto.imagen = imagen || producto.imagen;
    producto.descripcion = descripcion !== undefined ? descripcion : producto.descripcion;
    producto.categoria = categoria || producto.categoria;
    producto.visible = visible !== undefined ? visible : producto.visible;

    const productoActualizado = await producto.save();
    const productoConCategoria = await Producto.findById(productoActualizado._id)
      .populate('categoria', 'nombre');
    
    res.json(productoConCategoria);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
  }
};

// 🆕 NUEVO: Actualizar solo el stock
// @desc    Actualizar solo el stock de un producto
// @route   PATCH /api/productos/:id/stock
// @access  Privado/Admin
export const actualizarStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ mensaje: 'Stock inválido' });
    }

    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    producto.stock = stock;
    const productoActualizado = await producto.save();
    
    res.json({
      mensaje: 'Stock actualizado correctamente',
      producto: productoActualizado
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar stock', error: error.message });
  }
};

// @desc    Eliminar producto
// @route   DELETE /api/productos/:id
// @access  Privado/Admin
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    await producto.deleteOne();
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
  }
};

// @desc    Ocultar/Mostrar producto (cambiar visibilidad)
// @route   PATCH /api/productos/:id/visibilidad
// @access  Privado/Admin
export const cambiarVisibilidad = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    producto.visible = !producto.visible;
    const productoActualizado = await producto.save();
    
    res.json({
      mensaje: `Producto ${productoActualizado.visible ? 'mostrado' : 'ocultado'} correctamente`,
      producto: productoActualizado
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cambiar visibilidad', error: error.message });
  }
};
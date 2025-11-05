import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import mongoose from 'mongoose';

// @desc    Crear nuevo pedido online (público)
// @route   POST /api/pedidos
// @access  Público
export const crearPedido = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productos, cliente, metodoPago, costoEnvio, notas } = req.body;

    // Validaciones
    if (!productos || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Debe agregar al menos un producto' });
    }

    if (!cliente.nombre || !cliente.telefono) {
      return res.status(400).json({ mensaje: 'Nombre y teléfono son obligatorios' });
    }

    if (cliente.tipoEntrega === 'envio' && !cliente.direccion) {
      return res.status(400).json({ mensaje: 'La dirección es obligatoria para envíos' });
    }

    // Validar y preparar productos
    const productosVenta = [];
    let subtotal = 0;

    for (const item of productos) {
      const producto = await Producto.findById(item.producto).session(session);
      
      if (!producto) {
        await session.abortTransaction();
        return res.status(404).json({ mensaje: `Producto ${item.producto} no encontrado` });
      }

      if (!producto.visible) {
        await session.abortTransaction();
        return res.status(400).json({ mensaje: `El producto ${producto.nombre} no está disponible` });
      }

      // Validar stock (pero NO descuenta aún)
      if (producto.stock < item.cantidad) {
        await session.abortTransaction();
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}` 
        });
      }

      const precioUnitario = producto.precio;
      const precioTotal = precioUnitario * item.cantidad;

      productosVenta.push({
        producto: producto._id,
        nombreProducto: producto.nombre,
        cantidad: item.cantidad,
        talle: item.talle || '',
        precioUnitario: precioUnitario,
        precioTotal: precioTotal
      });

      subtotal += precioTotal;
    }

    // Generar número de pedido único
    const numeroPedido = await Pedido.generarNumeroPedido();

    // Calcular total
    const costoEnvioFinal = cliente.tipoEntrega === 'envio' ? (costoEnvio || 0) : 0;
    const total = subtotal + costoEnvioFinal;

    // Crear el pedido
    const pedido = await Pedido.create([{
      numeroPedido,
      productos: productosVenta,
      subtotal,
      costoEnvio: costoEnvioFinal,
      total,
      cliente,
      metodoPago,
      notas: notas || '',
      estadoPedido: 'pendiente',
      estadoPago: metodoPago === 'efectivo' ? 'pendiente' : 'pendiente',
      historialEstados: [{
        estado: 'pendiente',
        fecha: new Date(),
        observacion: 'Pedido creado'
      }]
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      pedido: pedido[0]
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ mensaje: 'Error al crear pedido', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Obtener todos los pedidos (Admin)
// @route   GET /api/pedidos
// @access  Privado/Admin
export const obtenerPedidos = async (req, res) => {
  try {
    const { estado, estadoPago } = req.query;
    
    let filtro = {};
    if (estado) filtro.estadoPedido = estado;
    if (estadoPago) filtro.estadoPago = estadoPago;

    const pedidos = await Pedido.find(filtro)
      .populate('productos.producto', 'nombre imagen')
      .sort({ createdAt: -1 });
    
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
  }
};

// @desc    Obtener pedido por ID
// @route   GET /api/pedidos/:id
// @access  Privado/Admin
export const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('productos.producto', 'nombre imagen');
    
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedido', error: error.message });
  }
};

// @desc    Actualizar estado del pedido
// @route   PATCH /api/pedidos/:id/estado
// @access  Privado/Admin
export const actualizarEstadoPedido = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { estado, observacion } = req.body;
    const pedido = await Pedido.findById(req.params.id).session(session);

    if (!pedido) {
      await session.abortTransaction();
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Si el estado cambia a "confirmado", descontar stock
    if (estado === 'confirmado' && pedido.estadoPedido === 'pendiente') {
      for (const item of pedido.productos) {
        const producto = await Producto.findById(item.producto).session(session);
        
        if (!producto) {
          await session.abortTransaction();
          return res.status(404).json({ mensaje: `Producto ${item.producto} no encontrado` });
        }

        if (producto.stock < item.cantidad) {
          await session.abortTransaction();
          return res.status(400).json({ 
            mensaje: `Stock insuficiente para ${producto.nombre}` 
          });
        }

        producto.stock -= item.cantidad;
        await producto.save({ session });
      }
    }

    // Si se cancela un pedido confirmado, restaurar stock
    if (estado === 'cancelado' && pedido.estadoPedido === 'confirmado') {
      for (const item of pedido.productos) {
        const producto = await Producto.findById(item.producto).session(session);
        if (producto) {
          producto.stock += item.cantidad;
          await producto.save({ session });
        }
      }
    }

    pedido.cambiarEstado(estado, observacion);
    await pedido.save({ session });

    await session.commitTransaction();
    res.json({ mensaje: 'Estado actualizado correctamente', pedido });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ mensaje: 'Error al actualizar estado', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Actualizar estado de pago
// @route   PATCH /api/pedidos/:id/pago
// @access  Privado/Admin
export const actualizarEstadoPago = async (req, res) => {
  try {
    const { estadoPago, datosPago } = req.body;
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    pedido.estadoPago = estadoPago;
    if (datosPago) {
      pedido.datosPago = { ...pedido.datosPago, ...datosPago };
    }

    await pedido.save();
    res.json({ mensaje: 'Estado de pago actualizado', pedido });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar pago', error: error.message });
  }
};

// @desc    Eliminar pedido
// @route   DELETE /api/pedidos/:id
// @access  Privado/Admin
export const eliminarPedido = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const pedido = await Pedido.findById(req.params.id).session(session);

    if (!pedido) {
      await session.abortTransaction();
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Si el pedido estaba confirmado, restaurar stock
    if (pedido.estadoPedido === 'confirmado') {
      for (const item of pedido.productos) {
        const producto = await Producto.findById(item.producto).session(session);
        if (producto) {
          producto.stock += item.cantidad;
          await producto.save({ session });
        }
      }
    }

    await pedido.deleteOne({ session });
    await session.commitTransaction();
    
    res.json({ mensaje: 'Pedido eliminado correctamente' });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ mensaje: 'Error al eliminar pedido', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Obtener estadísticas de pedidos
// @route   GET /api/pedidos/estadisticas
// @access  Privado/Admin
export const obtenerEstadisticas = async (req, res) => {
  try {
    const totalPedidos = await Pedido.countDocuments();
    const pendientes = await Pedido.countDocuments({ estadoPedido: 'pendiente' });
    const confirmados = await Pedido.countDocuments({ estadoPedido: 'confirmado' });
    const entregados = await Pedido.countDocuments({ estadoPedido: 'entregado' });

    const ingresoTotal = await Pedido.aggregate([
      { $match: { estadoPago: 'aprobado' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalPedidos,
      pendientes,
      confirmados,
      entregados,
      ingresoTotal: ingresoTotal[0]?.total || 0
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
  }
};
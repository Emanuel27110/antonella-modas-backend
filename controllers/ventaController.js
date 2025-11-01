import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import mongoose from 'mongoose';

// @desc    Obtener todas las ventas
// @route   GET /api/ventas
// @access  Privado/Admin
export const obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('vendedor', 'nombre email')
      .populate('productos.producto', 'nombre')
      .sort({ createdAt: -1 });
    
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas', error: error.message });
  }
};

// @desc    Obtener una venta por ID
// @route   GET /api/ventas/:id
// @access  Privado/Admin
export const obtenerVentaPorId = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('vendedor', 'nombre email')
      .populate('productos.producto', 'nombre imagen');
    
    if (!venta) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }
    
    res.json(venta);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener venta', error: error.message });
  }
};

// @desc    Crear nueva venta (descuenta stock automáticamente)
// @route   POST /api/ventas
// @access  Privado/Admin
export const crearVenta = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productos, metodoPago, cliente, notas } = req.body;

    // Validar que haya productos
    if (!productos || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Debe agregar al menos un producto' });
    }

    // Validar y preparar productos
    const productosVenta = [];
    let totalVenta = 0;

    for (const item of productos) {
      // Buscar el producto
      const producto = await Producto.findById(item.producto).session(session);
      
      if (!producto) {
        await session.abortTransaction();
        return res.status(404).json({ mensaje: `Producto ${item.producto} no encontrado` });
      }

      // Validar stock disponible
      if (producto.stock < item.cantidad) {
        await session.abortTransaction();
        return res.status(400).json({ 
          mensaje: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Solicitado: ${item.cantidad}` 
        });
      }

      // Calcular precio (usar el precio del body o el del producto)
      const precioUnitario = item.precioUnitario || producto.precio;
      const precioTotal = precioUnitario * item.cantidad;

      // Agregar al array de productos de la venta
      productosVenta.push({
        producto: producto._id,
        nombreProducto: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: precioUnitario,
        precioTotal: precioTotal
      });

      // Sumar al total
      totalVenta += precioTotal;

      // 🔥 DESCONTAR STOCK
      producto.stock -= item.cantidad;
      await producto.save({ session });
    }

    // Crear la venta
    const venta = await Venta.create([{
      productos: productosVenta,
      total: totalVenta,
      metodoPago: metodoPago || 'efectivo',
      cliente: cliente || {},
      notas: notas || '',
      vendedor: req.usuario._id
    }], { session });

    await session.commitTransaction();

    // Poblar la venta creada
    const ventaCompleta = await Venta.findById(venta[0]._id)
      .populate('vendedor', 'nombre email')
      .populate('productos.producto', 'nombre imagen');

    res.status(201).json({
      mensaje: 'Venta registrada exitosamente',
      venta: ventaCompleta
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ mensaje: 'Error al crear venta', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Eliminar venta (restaura el stock)
// @route   DELETE /api/ventas/:id
// @access  Privado/Admin
export const eliminarVenta = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const venta = await Venta.findById(req.params.id).session(session);

    if (!venta) {
      await session.abortTransaction();
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }

    // Restaurar stock de cada producto
    for (const item of venta.productos) {
      const producto = await Producto.findById(item.producto).session(session);
      
      if (producto) {
        producto.stock += item.cantidad;
        await producto.save({ session });
      }
    }

    // Eliminar la venta
    await venta.deleteOne({ session });

    await session.commitTransaction();
    res.json({ mensaje: 'Venta eliminada y stock restaurado correctamente' });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ mensaje: 'Error al eliminar venta', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Obtener estadísticas generales
// @route   GET /api/ventas/estadisticas
// @access  Privado/Admin
export const obtenerEstadisticas = async (req, res) => {
  try {
    const totalVentas = await Venta.countDocuments();
    const ventasHoy = await Venta.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const ingresoTotal = await Venta.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    const ingresoHoy = await Venta.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      totalVentas,
      ventasHoy,
      ingresoTotal: ingresoTotal[0]?.total || 0,
      ingresoHoy: ingresoHoy[0]?.total || 0
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
  }
};

// @desc    Obtener ventas por período
// @route   GET /api/ventas/estadisticas/periodo?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
// @access  Privado/Admin
export const obtenerVentasPorPeriodo = async (req, res) => {
  try {
    const { inicio, fin } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ mensaje: 'Debe proporcionar fecha de inicio y fin' });
    }

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    fechaFin.setHours(23, 59, 59, 999);

    const ventas = await Venta.find({
      createdAt: {
        $gte: fechaInicio,
        $lte: fechaFin
      }
    })
      .populate('vendedor', 'nombre')
      .sort({ createdAt: -1 });

    const totalIngreso = ventas.reduce((sum, venta) => sum + venta.total, 0);

    res.json({
      cantidad: ventas.length,
      total: totalIngreso,
      ventas
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas por período', error: error.message });
  }
};
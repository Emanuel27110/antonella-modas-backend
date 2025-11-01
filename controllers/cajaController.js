import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// @desc    Obtener resumen general de la caja
// @route   GET /api/caja/resumen
// @access  Privado/Admin
export const obtenerResumen = async (req, res) => {
  try {
    const ahora = new Date();

    // Total general
    const totalGeneral = await Venta.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Ventas de hoy
    const ventasHoy = await Venta.find({
      createdAt: { $gte: startOfDay(ahora), $lte: endOfDay(ahora) }
    });

    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);

    // Ventas de la semana
    const ventasSemana = await Venta.find({
      createdAt: { $gte: startOfWeek(ahora), $lte: endOfWeek(ahora) }
    });

    const totalSemana = ventasSemana.reduce((sum, v) => sum + v.total, 0);

    // Ventas del mes
    const ventasMes = await Venta.find({
      createdAt: { $gte: startOfMonth(ahora), $lte: endOfMonth(ahora) }
    });

    const totalMes = ventasMes.reduce((sum, v) => sum + v.total, 0);

    res.json({
      totalGeneral: totalGeneral[0]?.total || 0,
      hoy: {
        cantidad: ventasHoy.length,
        total: totalHoy
      },
      semana: {
        cantidad: ventasSemana.length,
        total: totalSemana
      },
      mes: {
        cantidad: ventasMes.length,
        total: totalMes
      }
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener resumen', error: error.message });
  }
};

// @desc    Obtener ventas del día
// @route   GET /api/caja/dia
// @access  Privado/Admin
export const obtenerVentasDelDia = async (req, res) => {
  try {
    const ahora = new Date();
    
    const ventas = await Venta.find({
      createdAt: { $gte: startOfDay(ahora), $lte: endOfDay(ahora) }
    })
      .populate('vendedor', 'nombre')
      .populate('productos.producto', 'nombre')
      .sort({ createdAt: -1 });

    const total = ventas.reduce((sum, v) => sum + v.total, 0);

    res.json({
      fecha: ahora.toISOString().split('T')[0],
      cantidad: ventas.length,
      total,
      ventas
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas del día', error: error.message });
  }
};

// @desc    Obtener ventas de la semana
// @route   GET /api/caja/semana
// @access  Privado/Admin
export const obtenerVentasDeLaSemana = async (req, res) => {
  try {
    const ahora = new Date();
    
    const ventas = await Venta.find({
      createdAt: { $gte: startOfWeek(ahora), $lte: endOfWeek(ahora) }
    })
      .populate('vendedor', 'nombre')
      .sort({ createdAt: -1 });

    const total = ventas.reduce((sum, v) => sum + v.total, 0);

    res.json({
      cantidad: ventas.length,
      total,
      ventas
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas de la semana', error: error.message });
  }
};

// @desc    Obtener ventas del mes
// @route   GET /api/caja/mes
// @access  Privado/Admin
export const obtenerVentasDelMes = async (req, res) => {
  try {
    const ahora = new Date();
    
    const ventas = await Venta.find({
      createdAt: { $gte: startOfMonth(ahora), $lte: endOfMonth(ahora) }
    })
      .populate('vendedor', 'nombre')
      .sort({ createdAt: -1 });

    const total = ventas.reduce((sum, v) => sum + v.total, 0);

    res.json({
      cantidad: ventas.length,
      total,
      ventas
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ventas del mes', error: error.message });
  }
};

// @desc    Obtener desglose por método de pago
// @route   GET /api/caja/metodos-pago
// @access  Privado/Admin
export const obtenerPorMetodoPago = async (req, res) => {
  try {
    const { periodo } = req.query; // 'dia', 'semana', 'mes', 'todo'
    const ahora = new Date();

    let filtroFecha = {};

    switch (periodo) {
      case 'dia':
        filtroFecha = { $gte: startOfDay(ahora), $lte: endOfDay(ahora) };
        break;
      case 'semana':
        filtroFecha = { $gte: startOfWeek(ahora), $lte: endOfWeek(ahora) };
        break;
      case 'mes':
        filtroFecha = { $gte: startOfMonth(ahora), $lte: endOfMonth(ahora) };
        break;
      default:
        filtroFecha = {}; // Todo
    }

    const desglose = await Venta.aggregate([
      ...(Object.keys(filtroFecha).length > 0 ? [{ $match: { createdAt: filtroFecha } }] : []),
      {
        $group: {
          _id: '$metodoPago',
          cantidad: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json(desglose);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener desglose por método de pago', error: error.message });
  }
};

// @desc    Obtener productos más vendidos
// @route   GET /api/caja/top-productos
// @access  Privado/Admin
export const obtenerTopProductos = async (req, res) => {
  try {
    const { limite = 10 } = req.query;

    const topProductos = await Venta.aggregate([
      { $unwind: '$productos' },
      {
        $group: {
          _id: '$productos.producto',
          nombreProducto: { $first: '$productos.nombreProducto' },
          cantidadVendida: { $sum: '$productos.cantidad' },
          ingresoTotal: { $sum: '$productos.precioTotal' }
        }
      },
      {
        $sort: { cantidadVendida: -1 }
      },
      {
        $limit: parseInt(limite)
      }
    ]);

    // Poblar con información del producto
    const topConInfo = await Producto.populate(topProductos, {
      path: '_id',
      select: 'nombre imagen precio stock'
    });

    res.json(topConInfo);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener top productos', error: error.message });
  }
};
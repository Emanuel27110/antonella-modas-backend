import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema({
  // Productos vendidos (array)
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
      },
      nombreProducto: {
        type: String,
        required: true
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1
      },
      precioUnitario: {
        type: Number,
        required: true,
        min: 0
      },
      precioTotal: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  // Total de la venta
  total: {
    type: Number,
    required: true,
    min: 0
  },
  // Método de pago
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'mercadopago', 'otro'],
    default: 'efectivo'
  },
  // Datos del cliente (opcional)
  cliente: {
    nombre: {
      type: String,
      trim: true,
      default: ''
    },
    telefono: {
      type: String,
      trim: true,
      default: ''
    }
  },
  // Notas adicionales
  notas: {
    type: String,
    trim: true,
    default: ''
  },
  // Usuario que realizó la venta
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true // Fecha de venta automática
});

// Método para calcular el total automáticamente
ventaSchema.methods.calcularTotal = function() {
  this.total = this.productos.reduce((sum, item) => sum + item.precioTotal, 0);
  return this.total;
};

const Venta = mongoose.model('Venta', ventaSchema);

export default Venta;
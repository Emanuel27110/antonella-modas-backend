import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
  // Número único de pedido (formato: PED-20241103-001)
  numeroPedido: {
    type: String,
    required: true,
    unique: true
  },
  
  // Productos del pedido
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
      talle: {
        type: String,
        default: ''
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

  // Totales
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  costoEnvio: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Datos del cliente
  cliente: {
    nombre: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono del cliente es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    direccion: {
      type: String,
      trim: true,
      default: ''
    },
    zona: {
      type: String,
      trim: true,
      default: ''
    },
    tipoEntrega: {
      type: String,
      enum: ['envio', 'retiro'],
      required: true,
      default: 'retiro'
    }
  },

  // Estados del pedido
  estadoPedido: {
    type: String,
    enum: ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  
  estadoPago: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },

  // Método de pago
  metodoPago: {
    type: String,
    enum: ['transferencia', 'efectivo', 'visa', 'mastercard', 'naranja'],
    required: true
  },

  // Datos de pago (para transferencias)
  datosPago: {
    comprobante: {
      type: String, // URL de Cloudinary
      default: ''
    },
    numeroTransaccion: {
      type: String,
      default: ''
    },
    fechaPago: {
      type: Date
    }
  },

  // Notas adicionales
  notas: {
    type: String,
    trim: true,
    default: ''
  },

  // Historial de cambios de estado
  historialEstados: [
    {
      estado: String,
      fecha: {
        type: Date,
        default: Date.now
      },
      observacion: String
    }
  ]

}, {
  timestamps: true
});

// Método para generar número de pedido único
pedidoSchema.statics.generarNumeroPedido = async function() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  const prefijo = `PED-${año}${mes}${dia}`;
  
  // Contar pedidos del día
  const count = await this.countDocuments({
    numeroPedido: { $regex: `^${prefijo}` }
  });
  
  const numero = String(count + 1).padStart(3, '0');
  return `${prefijo}-${numero}`;
};

// Método para calcular totales
pedidoSchema.methods.calcularTotales = function() {
  this.subtotal = this.productos.reduce((sum, item) => sum + item.precioTotal, 0);
  this.total = this.subtotal + (this.costoEnvio || 0);
  return this.total;
};

// Método para agregar cambio de estado al historial
pedidoSchema.methods.cambiarEstado = function(nuevoEstado, observacion = '') {
  this.estadoPedido = nuevoEstado;
  this.historialEstados.push({
    estado: nuevoEstado,
    fecha: new Date(),
    observacion
  });
};

const Pedido = mongoose.model('Pedido', pedidoSchema);

export default Pedido;
import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: 0
  },
  // 🆕 NUEVO: Campo de stock
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: 0,
    default: 0
  },
  // 🆕 NUEVO: Stock mínimo para alertas
  stockMinimo: {
    type: Number,
    default: 5,
    min: 0
  },
  talles: {
    type: [String],
    default: []
  },
  imagen: {
    type: String,
    default: ''
  },
  descripcion: {
    type: String,
    trim: true,
    default: ''
  },
  visible: {
    type: Boolean,
    default: true
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoría es obligatoria']
  }
}, {
  timestamps: true
});

// 🆕 NUEVO: Método virtual para saber si el stock está bajo
productoSchema.virtual('stockBajo').get(function() {
  return this.stock <= this.stockMinimo;
});

// 🆕 NUEVO: Método para descontar stock
productoSchema.methods.descontarStock = async function(cantidad) {
  if (this.stock < cantidad) {
    throw new Error(`Stock insuficiente. Disponible: ${this.stock}, Solicitado: ${cantidad}`);
  }
  this.stock -= cantidad;
  return await this.save();
};

// 🆕 NUEVO: Método para reponer stock
productoSchema.methods.agregarStock = async function(cantidad) {
  this.stock += cantidad;
  return await this.save();
};

// Configurar virtuals en JSON
productoSchema.set('toJSON', { virtuals: true });
productoSchema.set('toObject', { virtuals: true });

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;
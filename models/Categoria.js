import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoría es obligatorio'],
    trim: true,
    unique: true
  },
  descripcion: {
    type: String,
    trim: true,
    default: ''
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Categoria = mongoose.model('Categoria', categoriaSchema);

export default Categoria;
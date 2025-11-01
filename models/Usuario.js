import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 6
  },
  rol: {
    type: String,
    default: 'admin',
    enum: ['admin']
  }
}, {
  timestamps: true
});

// Encriptar password antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar passwords
usuarioSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;
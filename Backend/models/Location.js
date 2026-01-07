const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true // Para evitar duplicados como dos "Facultad de Artes"
  },
  type: { 
    type: String, 
    enum: ['facultad', 'administrativo', 'biblioteca', 'teatro', 'cafeteria', 'otro'],
    required: true 
  },
  // Coordenadas para tu mapa 3D en React Three Fiber
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  // Opcional: Para mostrar información extra al hacer click
  description: String
});

module.exports = mongoose.model('Location', LocationSchema);
const mongoose = require('mongoose');
const Location = require('./models/Location');
require('dotenv').config(); // Asegúrate de tener tu conexión a Mongo aquí

// Datos de la Universidad Central del Ecuador
const campusLocations = [
  { name: "Facultad de Artes", type: "facultad", coordinates: { x: 10, y: 0, z: -5 } },
  { name: "Facultad de Jurisprudencia", type: "facultad", coordinates: { x: -20, y: 0, z: 10 } },
  { name: "Biblioteca Central", type: "biblioteca", coordinates: { x: 0, y: 0, z: 0 } },
  { name: "Teatro Universitario", type: "teatro", coordinates: { x: 5, y: 0, z: 15 } },
  { name: "Edificio Administrativo", type: "administrativo", coordinates: { x: -5, y: 0, z: -10 } },
  { name: "Comedor Universitario", type: "cafeteria", coordinates: { x: 15, y: 0, z: 5 } }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Tu string de conexión
    console.log("Conectado a MongoDB...");

    // Limpia la colección anterior para evitar duplicados
    await Location.deleteMany({});
    console.log("Colección limpiada.");

    // Inserta los nuevos datos
    await Location.insertMany(campusLocations);
    console.log("¡Ubicaciones insertadas correctamente!");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
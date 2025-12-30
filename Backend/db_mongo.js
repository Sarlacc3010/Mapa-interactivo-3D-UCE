const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://admin_mongo:password_mongo@localhost:27017/uce_facultades_db?authSource=admin';

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 Conectado a MongoDB");
  } catch (err) {
    console.error("🔴 Error conectando a MongoDB:", err);
  }
};

module.exports = connectMongo;
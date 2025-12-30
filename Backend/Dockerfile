# Backend/Dockerfile

# Usamos una versión ligera de Node
FROM node:18-alpine

# Creamos carpeta de trabajo
WORKDIR /app

# Copiamos primero los archivos de dependencias (para aprovechar caché)
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto del backend
EXPOSE 5000

# Comando para iniciar (asegúrate de que en package.json tengas "start": "node index.js")
CMD ["node", "index.js"]
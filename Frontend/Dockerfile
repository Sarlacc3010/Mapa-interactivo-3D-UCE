# 🔥 CAMBIO AQUÍ: Usamos Node 22 en lugar de 18
FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Comando por defecto
CMD ["npm", "run", "dev", "--", "--host"]
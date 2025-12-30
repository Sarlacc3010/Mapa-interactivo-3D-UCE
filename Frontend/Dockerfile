# Frontend/Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# IMPORTANTE: --host permite que el contenedor sea accesible desde fuera
CMD ["npm", "run", "dev", "--", "--host"]
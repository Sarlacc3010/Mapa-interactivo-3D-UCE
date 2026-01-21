# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM node:22-alpine as builder

WORKDIR /app

# Copiamos solo los package.json para instalar dependencias primero (aprovecha caché)
COPY package*.json ./
# Usamos 'ci' en lugar de 'install' para entornos limpios
RUN npm ci

# Copiamos el código fuente
COPY . .

# Construimos la carpeta 'dist'
RUN npm run build

# --- ETAPA 2: SERVIDOR WEB (NGINX) ---
# Usamos Nginx, que es ultraligero, solo para servir archivos estáticos
FROM nginx:alpine

# Copiamos la configuración de Nginx (Opcional, pero recomendado para React Router)
# COPY nginx.conf /etc/nginx/conf.d/default.conf 

# Copiamos SOLO la carpeta dist creada en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx corre en el puerto 80 por defecto
EXPOSE 80

# Ejecutamos Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
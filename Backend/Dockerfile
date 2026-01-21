FROM node:18-alpine

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./

# Instalamos solo dependencias de producción (más ligero)
RUN npm ci --only=production

# --- SEGURIDAD: CAMBIO DE USUARIO ---
# Copiamos el código asignando permisos al usuario 'node'
COPY --chown=node:node . .

# Cambiamos del usuario 'root' al usuario 'node'
USER node

EXPOSE 5000

CMD ["node", "index.js"]
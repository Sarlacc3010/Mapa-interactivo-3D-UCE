# ============================================
# STAGE 1: Dependencies (Builder)
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copiamos solo package files para aprovechar cache de Docker
COPY package*.json ./

# Instalamos solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# ============================================
# STAGE 2: Production
# ============================================
FROM node:18-alpine

WORKDIR /app

# Copiamos node_modules desde el stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el código de la aplicación
COPY --chown=node:node . .

# --- SEGURIDAD: Ejecutar como usuario no-root ---
USER node

EXPOSE 5000

# Health check para Docker/AWS
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
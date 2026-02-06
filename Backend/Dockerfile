# ============================================
# STAGE 1: Dependencies (Builder)
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only package files to leverage Docker cache
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ============================================
# STAGE 2: Production
# ============================================
FROM node:18-alpine

WORKDIR /app

# Copy node_modules from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --chown=node:node . .

# --- SECURITY: Run as non-root user ---
USER node

EXPOSE 5000

# Health check for Docker/AWS
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
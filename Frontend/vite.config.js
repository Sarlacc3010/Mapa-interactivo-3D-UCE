import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Necesario para Docker: expone el puerto fuera del contenedor
    strictPort: true, // Falla si el puerto 5173 ya está en uso
    port: 5173,       // Puerto estándar de Vite
    watch: {
      usePolling: true, // Crítico para que los cambios de código se reflejen en Docker (especialmente en Windows)
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Three.js en su propio chunk (muy pesado ~600KB)
          'three': ['three'],
          // Separar React Query en su propio chunk
          'react-query': ['@tanstack/react-query'],
          // Separar Socket.IO en su propio chunk
          'socket': ['socket.io-client'],
          // Separar Lucide icons en su propio chunk
          'icons': ['lucide-react'],
        }
      }
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 1000,
  }
})
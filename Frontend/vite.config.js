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
    // 🚀 PRODUCCIÓN: Minificación agresiva con Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Elimina console.log en producción
        drop_debugger: true,     // Elimina debugger statements
        pure_funcs: ['console.info', 'console.debug'] // Elimina funciones específicas
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 📦 React ecosystem (core libraries)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // 🎨 Three.js ecosystem (muy pesado ~600KB)
          'three': ['three'],
          'three-fiber': ['@react-three/fiber', '@react-three/drei'],

          // 🔄 Data fetching & state
          'react-query': ['@tanstack/react-query'],

          // 🔌 Real-time communication
          'socket': ['socket.io-client'],

          // 🎯 Icons (separado para mejor caching)
          'icons': ['lucide-react'],

          // 📊 Charts & UI components
          'ui-vendor': ['recharts']
        }
      }
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 1000,

    // 🎯 Optimizaciones adicionales
    reportCompressedSize: false, // Más rápido en CI/CD
    sourcemap: false,            // No generar sourcemaps en producción (más rápido)

    // 📦 Optimización de assets
    assetsInlineLimit: 4096,     // Inline assets < 4KB como base64
  }
})
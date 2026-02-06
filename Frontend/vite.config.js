import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Necessary for Docker: exposes port outside container
    strictPort: true, // Fails if port 5173 is already in use
    port: 5173,       // Standard Vite port
    watch: {
      usePolling: true, // Critical for code changes to reflect in Docker (especially on Windows)
    }
  },
  build: {
    // PRODUCTION: Aggressive minification with Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.log in production
        drop_debugger: true,     // Remove debugger statements
        pure_funcs: ['console.info', 'console.debug'] // Remove specific functions
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem (core libraries)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Three.js ecosystem (very heavy ~600KB)
          'three': ['three'],
          'three-fiber': ['@react-three/fiber', '@react-three/drei'],

          // Data fetching & state
          'react-query': ['@tanstack/react-query'],

          // Real-time communication
          'socket': ['socket.io-client'],

          // Icons (separated for better caching)
          'icons': ['lucide-react'],

          // Charts & UI components
          'ui-vendor': ['recharts']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Additional optimizations
    reportCompressedSize: false, // Faster in CI/CD
    sourcemap: false,            // Do not generate sourcemaps in production (faster)

    // Assets optimization
    assetsInlineLimit: 4096,     // Inline assets < 4KB as base64
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
  },
  define: {
    // Ensure proper Node.js globals are available
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['lucide-react', 'react-hot-toast', 'framer-motion'],
          charts: ['recharts'],
          utils: ['date-fns', 'date-fns-tz', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    // Add compatibility settings for WebContainer
    hmr: {
      port: 3001,
    },
  },
  define: {
    // Ensure proper Node.js globals are available
    global: 'globalThis',
  },
  optimizeDeps: {
    // Force pre-bundling of problematic dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'framer-motion',
      'lucide-react',
      'recharts',
      'react-hot-toast',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
  },
  build: {
    target: 'esnext',
    minify: false,
  },
})
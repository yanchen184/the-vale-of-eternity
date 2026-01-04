import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // command is 'serve' for dev, 'build' for production
  const isProduction = command === 'build'
  return {
  plugins: [react()],
  base: isProduction ? '/the-vale-of-eternity/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Include webp files as assets
  assetsInclude: ['**/*.webp'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          animations: ['gsap'],
        },
        // Optimize asset file naming
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (name.endsWith('.webp')) {
            return 'assets/cards/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  }
})

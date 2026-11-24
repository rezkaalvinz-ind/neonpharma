import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  // Default build memakai root "/" (Vercel, Netlify, custom domain).
  // GitHub Pages menyajikan project page dari /<repo>/, jadi workflow CI
  // menimpanya lewat VITE_BASE_PATH=/neonpharma/. Tanpa env itu, base = "/".
  base: command === 'build' ? process.env.VITE_BASE_PATH ?? '/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
}))

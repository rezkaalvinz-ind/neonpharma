import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  // GitHub Pages menyajikan project page dari /<repo>/, sedangkan dev dari /.
  // Bisa ditimpa lewat VITE_BASE_PATH (mis. "/" saat pakai custom domain).
  base: command === 'build' ? process.env.VITE_BASE_PATH ?? '/neonpharma/' : '/',
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

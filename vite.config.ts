import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/visapp/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3001,
    open: true
  }
})

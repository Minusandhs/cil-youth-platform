import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,   // required for hot-reload inside Docker on Windows
    },
    proxy: {
      '/api': {
        target: 'http://server:5000',
        changeOrigin: true,
      }
    }
  }
})
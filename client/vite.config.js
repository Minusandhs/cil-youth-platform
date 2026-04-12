import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,           // Frontend runs on port 3000
    host: true,           // Required for Docker
    proxy: {
      // Forward /api requests to backend
      '/api': {
        target: 'http://server:5000',
        changeOrigin: true,
      }
    }
  }
})
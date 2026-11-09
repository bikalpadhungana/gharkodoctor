import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev: the app calls relative /api (same as production), proxied to the local backend.
    proxy: {
      '/api': 'http://localhost:5004',
      '/uploads': 'http://localhost:5004'
    }
  }
})

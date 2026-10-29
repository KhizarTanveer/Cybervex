import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API server (server/index.js) runs on port 4000 (or API_PORT); forward /api to it
const apiProxy = { '/api': `http://localhost:${process.env.API_PORT || 4000}` }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})

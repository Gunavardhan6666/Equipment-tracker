import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Dev Server Proxy ─────────────────────────────────────────────────────
  // Forwards /api/* requests to the Express backend during development.
  // This eliminates CORS issues in dev — the browser sees only one origin.
  // In production, the web server (Nginx / hosting platform) handles routing.
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

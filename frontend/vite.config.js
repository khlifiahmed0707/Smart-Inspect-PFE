import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // Génère un certificat SSL auto-signé → HTTPS activé
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: 'all',
    https: true, // Active HTTPS → getUserMedia fonctionnera sur mobile
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
      '/verify-dynamic': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/verify': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
      '/extract': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
      },
    },
  },
})


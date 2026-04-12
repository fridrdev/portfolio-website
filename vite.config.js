import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxmox Flask API endpoints (local dev → http://localhost:5000)
const PROXMOX_PATHS = ['/api/status', '/api/migrate', '/api/ping', '/api/latency', '/api/verify', '/api/ping-nodes']

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxmox PoC API — matches specific paths first
      ...Object.fromEntries(
        PROXMOX_PATHS.map(p => [
          p,
          {
            target: 'http://localhost:5000',
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, ''),
          },
        ])
      ),
      // VRT — AWS API Gateway catch-all for remaining /api/* paths
      '/api': {
        target: 'https://oku2jon40l.execute-api.eu-west-3.amazonaws.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})

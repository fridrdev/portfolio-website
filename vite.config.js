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
      // Proxmox PoC API — specific paths first → localhost:5000
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
      // VRT — AWS API Gateway for recommendation-service
      '/api/recommendation-service': {
        target: 'https://oku2jon40l.execute-api.eu-west-3.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('[proxy error]', err))
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxy →AWS]', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[proxy ←AWS]', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
})

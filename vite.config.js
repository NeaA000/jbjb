import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 비디오 파일 프록시
      '/video': {
        target: 'https://videouploader-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // CORS 헤더 중복 제거
            const allowOrigin = proxyRes.headers['access-control-allow-origin'];
            if (allowOrigin && allowOrigin.includes(',')) {
              proxyRes.headers['access-control-allow-origin'] = '*';
            }
          });
        }
      },
      // 썸네일 프록시
      '/thumbnail': {
        target: 'https://videouploader-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const allowOrigin = proxyRes.headers['access-control-allow-origin'];
            if (allowOrigin && allowOrigin.includes(',')) {
              proxyRes.headers['access-control-allow-origin'] = '*';
            }
          });
        }
      },
      // QR 코드 프록시
      '/qr': {
        target: 'https://videouploader-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const allowOrigin = proxyRes.headers['access-control-allow-origin'];
            if (allowOrigin && allowOrigin.includes(',')) {
              proxyRes.headers['access-control-allow-origin'] = '*';
            }
          });
        }
      },
      // API 프록시
      '/api': {
        target: 'https://videouploader-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const allowOrigin = proxyRes.headers['access-control-allow-origin'];
            if (allowOrigin && allowOrigin.includes(',')) {
              proxyRes.headers['access-control-allow-origin'] = '*';
            }
          });
        }
      },
      // watch 경로 프록시
      '/watch': {
        target: 'https://videouploader-production.up.railway.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
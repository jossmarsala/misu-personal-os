import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/gdrive-proxy': {
        target: 'https://drive.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gdrive-proxy/, ''),
        headers: {
          'Origin': 'https://drive.google.com',
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['misu-logo-color.svg', 'favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Misu — OS',
        short_name: 'Misu',
        description: 'Cognitive Task System',
        theme_color: '#1c1c24',
        background_color: '#1c1c24',
        display: 'standalone',
        icons: [
          {
            src: 'misu-logo-color.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon-192.svg', 'icon-512.svg'],
        manifest: {
          name: 'Listou',
          short_name: 'Listou',
          description: 'Organize, economize, repita.',
          theme_color: '#10b981',
          background_color: '#F8FAFC',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
          navigateFallback: '/index.html',
          runtimeCaching: [{
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkOnly',
          }],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

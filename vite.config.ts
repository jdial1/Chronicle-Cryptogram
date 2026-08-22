import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/data/appVersion';

function editionVersionPlugin(): Plugin {
  const payload = JSON.stringify({ version: APP_VERSION });
  return {
    name: 'edition-version',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/version.json') {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(payload);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './', // Use relative paths for GitHub Pages hosting
    plugins: [
      react(),
      tailwindcss(),
      editionVersionPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: [
          'apple-touch-icon.png',
          'favicon-32x32.png',
          'mask-icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-512x512-maskable.png',
          'fonts.css',
          'fonts/*.woff2',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],
          navigateFallbackDenylist: [/version\.json/i],
          runtimeCaching: [
            {
              urlPattern: /\/version\.json/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && !/version\.json$/i.test(url.pathname),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'chronicle-press-pack',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          start_url: '.',
          name: 'Chronicle Cryptogram',
          short_name: 'Chronicle Cryptogram',
          description: 'A 1920s Serialized Cryptogram Mystery',
          theme_color: '#fbf7ee',
          background_color: '#fbf7ee',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        }
      })
    ],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          shot: path.resolve(__dirname, 'shot.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

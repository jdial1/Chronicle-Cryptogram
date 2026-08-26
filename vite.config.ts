import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync } from 'fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/data/appVersion';

function editionVersionPlugin(): Plugin {
  const payload = JSON.stringify({ version: APP_VERSION });
  return {
    name: 'edition-version',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (
          url === '/splash' ||
          url === '/splash.html' ||
          url === '/splashdev' ||
          url === '/splashdev.html'
        ) {
          req.url = '/index.html';
          next();
          return;
        }
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
    writeBundle(options) {
      const dir = options.dir || path.resolve(__dirname, 'dist');
      const index = path.join(dir, 'index.html');
      if (!existsSync(index)) return;
      copyFileSync(index, path.join(dir, 'splash.html'));
      copyFileSync(index, path.join(dir, 'splashdev.html'));
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
          'orang-top-games.png',
          'orang-top-games-plate.png',
          'orang-top-games-plate-2.png',
          'splash.css',
          'fonts-desk.css',
          'fonts/cinzel-900.woff2',
          'fonts/playfair-display-700.woff2',
          'fonts/newsreader-400.woff2',
          'fonts/special-elite-400.woff2',
        ],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,webmanifest}'],
          globIgnores: ['**/shot.html', '**/pwa-512*'],
          navigateFallbackDenylist: [/version\.json/i],
          runtimeCaching: [
            {
              urlPattern: /\/version\.json/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ request, url, sameOrigin }) =>
                sameOrigin &&
                !/version\.json$/i.test(url.pathname) &&
                (request.destination === 'script' ||
                  request.destination === 'style' ||
                  request.destination === 'font' ||
                  /\.(?:js|css|woff2)$/i.test(url.pathname)),
              handler: 'CacheFirst',
              options: {
                cacheName: 'chronicle-shell',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
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
      target: 'es2022',
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          shot: path.resolve(__dirname, 'shot.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});

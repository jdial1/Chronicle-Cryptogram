import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync } from 'fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/data/appVersion';

/**
 * Demo builds ship only editions 0..VITE_MAX_EDITION. The withheld editions are
 * removed from the bundle, not merely hidden -- and because case-file fragments
 * only assemble when their edition's puzzle exists, dropping the puzzles takes
 * the narrative with them. maxEdition() then clamps the progression gate on its
 * own, so no separate ceiling check is needed anywhere.
 */
function demoContentPlugin(): Plugin | null {
  const raw = process.env.VITE_MAX_EDITION;
  if (!raw) return null;
  const ceiling = Number(raw);
  if (!Number.isInteger(ceiling) || ceiling < 1) {
    throw new Error(`VITE_MAX_EDITION must be a positive integer, got "${raw}"`);
  }
  return {
    name: 'demo-content',
    enforce: 'pre',
    transform(code, id) {
      const file = id.replace(/\\/g, '/');

      if (file.endsWith('src/data/puzzles.json')) {
        const all = JSON.parse(code) as { editionNumber: number }[];
        const kept = all.filter((puzzle) => puzzle.editionNumber <= ceiling);
        this.warn(`demo build: shipping ${kept.length}/${all.length} puzzles (editions 0-${ceiling})`);
        return { code: JSON.stringify(kept), map: null };
      }

      // Fragments cannot render without their edition's puzzle, but their prose would
      // still sit in the bundle for anyone with devtools. Cut them out too.
      if (file.endsWith('src/data/caseFiles.ts')) {
        const open = 'export const CASE_FRAGMENTS: CaseFragment[] = [';
        const start = code.indexOf(open);
        if (start === -1) throw new Error('demo build: CASE_FRAGMENTS array not found');
        const bodyStart = start + open.length;
        const end = code.indexOf('\n];', bodyStart);
        if (end === -1) throw new Error('demo build: CASE_FRAGMENTS array is unterminated');

        const body = code.slice(bodyStart, end);
        const entries = body.match(/\n  \{\n[\s\S]*?\n  \},/g) ?? [];
        if (entries.join('') !== body) {
          throw new Error('demo build: CASE_FRAGMENTS entries did not parse cleanly; refusing to cut');
        }
        const kept = entries.filter((entry) => {
          const found = /\n    editionNumber: (\d+),/.exec(entry);
          if (!found) throw new Error('demo build: fragment without an editionNumber');
          return Number(found[1]) <= ceiling;
        });
        this.warn(`demo build: shipping ${kept.length}/${entries.length} case fragments`);
        return {
          code: code.slice(0, bodyStart) + kept.join('') + code.slice(end),
          map: null,
        };
      }

      return null;
    },
  };
}

/** True when building the copy that ships inside the Android app rather than to Pages. */
const isBundledBuild = process.env.VITE_BUNDLED === '1';

/**
 * The bundled build is served by WebViewAssetLoader from a synthetic origin, so the
 * Pages origin in the CSP is dead weight and the Google Identity Services entries are
 * unreachable -- the shell does sign-in natively and never loads the GIS script.
 * Narrowing it here keeps one index.html as the single source of truth.
 */
function bundledBuildPlugin(): Plugin | null {
  if (!isBundledBuild) return null;
  const csp = [
    "default-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    // Google profile photos on the agent plate are remote.
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ') + ';';

  const PWA_STUB = 'virtual:pwa-register';
  return {
    name: 'bundled-build',
    // main.tsx guards the call, but Rollup still resolves the import inside the dead
    // branch, and VitePWA -- which normally supplies this module -- is not loaded here.
    resolveId(id) {
      return id === PWA_STUB ? `\0${PWA_STUB}` : null;
    },
    load(id) {
      return id === `\0${PWA_STUB}` ? 'export function registerSW() {}' : null;
    },
    transformIndexHtml(html, ctx) {
      // shot.html is a screenshot harness and carries no CSP; only the app entry does.
      if (!ctx.path.endsWith('index.html')) return html;
      const pattern = /(<meta http-equiv="Content-Security-Policy" content=")[^"]*(")/;
      if (!pattern.test(html)) {
        throw new Error('bundled build: could not find the CSP meta tag in index.html');
      }
      return html.replace(pattern, `$1${csp}$2`);
    },
  };
}

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
      // A bundled build's version is fixed at install time and updates arrive via
      // Play, so there is nothing for useEditionUpdate to poll.
      if (isBundledBuild) return;
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
    },
    writeBundle(options) {
      if (isBundledBuild) return; // path-based splash previews need a server
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
      demoContentPlugin(),
      bundledBuildPlugin(),
      react(),
      tailwindcss(),
      editionVersionPlugin(),
      // No service worker in the bundled build: the assets are already on disk, and a
      // registered worker would try real DNS for the asset-loader origin, since
      // ServiceWorkerController is a separate interception point from the WebView's.
      !isBundledBuild &&
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
          // crash-reporter is fetched on demand: reporting needs the network anyway,
          // so precaching it would only pad the offline press pack.
          globIgnores: ['**/shot.html', '**/pwa-512*', '**/crash-reporter-*.js'],
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
          // shot.html is the store-screenshot harness; excluding the entry outright
          // beats shipping its orphaned chunk into the APK.
          ...(isBundledBuild ? {} : { shot: path.resolve(__dirname, 'shot.html') }),
        },
        output: {
          manualChunks: (id) => (id.includes('@sentry') ? 'crash-reporter' : undefined),
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

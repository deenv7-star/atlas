import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Build info for /admin → תקינות מערכת (Vercel sets VERCEL_GIT_* during builds).
const ATLAS_BUILD = {
  sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
  branch: process.env.VERCEL_GIT_COMMIT_REF || null,
  message: (process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0].slice(0, 120) || null,
  env: process.env.VERCEL_ENV || null,
  time: new Date().toISOString(),
};

export default defineConfig({
  define: { __ATLAS_BUILD__: JSON.stringify(ATLAS_BUILD) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      // Only the small icons are precached; big images (1 MB logo svg, og images, 1024px icons) load on demand,
      // so a phone's first visit is not spent downloading ~2.7 MB of pictures the app screens never show.
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: false, // we manage our own manifest.json in public/
      workbox: {
        // Fetch current HTML on each navigation; a precached shell pins returning browsers
        // to an older release. Keep navigation responses only as an offline fallback.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,woff2}'],
        globIgnores: ['**/registerSW.js', '**/sw-cleanup.js', '**/google*.html'],
        // One-time cleanup for browsers still on a pre-#109 worker (it answered every page with a stored
        // index.html): delete stale caches and load open tabs fresh once. See public/sw-cleanup.js.
        importScripts: ['/sw-cleanup.js'],
        // Cache API calls for offline fallback
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === 'navigate' &&
              url.origin === self.location.origin && !url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              // v2: older builds' stored pages are dropped on activate (sw-cleanup.js); this copy is only
              // an offline fallback, a page is always fetched from the network first.
              cacheName: 'atlas-pages-v2',
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache API responses for a short time to support offline browsing
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    // read by scripts/prerender.mjs (CSS / JS of the prerendered "/" and /pricing), then deleted from dist
    manifest: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

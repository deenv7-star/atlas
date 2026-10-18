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
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: false, // we manage our own manifest.json in public/
      workbox: {
        // SPA: direct visits to /api-docs, /changelog, etc. must resolve to index.html
        // (avoids blank pages / stuck loaders when the SW or host mishandles navigation).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Cache API calls for offline fallback
        runtimeCaching: [
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

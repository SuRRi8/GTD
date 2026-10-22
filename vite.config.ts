/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Neue Versionen werden beim nächsten Öffnen still übernommen
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GTD – Getting Things Done',
        short_name: 'GTD',
        description: 'Erfassen, Klären, Organisieren, Durchsehen, Erledigen – für Arbeit und Privat.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f6f5f1',
        theme_color: '#2c6b66',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Eingang', url: '/eingang' },
          { name: 'Jetzt', url: '/jetzt' },
          { name: 'Klären', url: '/klaeren' },
        ],
      },
      workbox: {
        // Alle Routen offline aus dem Cache bedienen
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
})

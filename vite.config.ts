/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// GitHub Pages sert le site sous /triathlon-adaptatif/, mais le serveur de dev sert la racine.
const BASE = '/triathlon-adaptatif/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  // Date de compilation, affichée dans les réglages pour vérifier qu'on est à jour.
  define: {
    __BUILD__: JSON.stringify(
      new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Programme adaptatif',
        lang: 'fr',
        short_name: 'Programme',
        description:
          "Programme d'entraînement triathlon qui se réorganise selon les créneaux réellement disponibles",
        theme_color: '#12202B',
        background_color: '#EDEFF1',
        display: 'standalone',
        orientation: 'portrait',
        // start_url et scope sont déduits du `base` ci-dessus, ne pas les figer ici.
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))

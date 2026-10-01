import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({mode})=>({
  plugins: [react(), ...(mode==='android'?[]:[VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    workbox: { globIgnores: ['cinematics/goku-ultra-instinct.mp4','audio/rank-*.mp3','audio/card-open.mp3'], globPatterns: ['**/*.{js,css,html,png,svg,webp,woff,woff2,mp3,mp4}'] },
    manifest: {
      name: 'Ascend — Training Command Center', short_name: 'Ascend',
      start_url: '/', scope: '/', id: '/',
      description: 'Your personal strength training command center',
      theme_color: '#080c14', background_color: '#080c14', display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  })])],
}))

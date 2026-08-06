import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In sviluppo il frontend gira su :3000 e inoltra le chiamate al backend
// Spring su :8080 (sovrascrivibile con VITE_BACKEND_URL) evitando problemi di CORS.
const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080'

const backendProxy = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/token': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/services': {
    target: backendTarget,
    changeOrigin: true,
  },
} as const

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    strictPort: true,
    proxy: backendProxy,
  },
  preview: {
    port: 3000,
    strictPort: true,
    proxy: backendProxy,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})

export default config

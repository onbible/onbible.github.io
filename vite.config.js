import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyIndexTo404 } from './scripts/copy-spa-404.js'

// https://vitejs.dev/config/
let spaOutDir = ''
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'gh-pages-spa-404',
      configResolved(config) {
        spaOutDir = resolve(config.root, config.build.outDir)
      },
      closeBundle() {
        copyIndexTo404(spaOutDir)
      },
    },
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 2222,
    strictPort: true,
    watch: {
      ignored: ['**/assets/libs/**', '**/vendor/**', '**/db/**', '**/node_modules/**'],
    },
  },
})

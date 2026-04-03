import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyIndexTo404 } from './scripts/copy-spa-404.js'
import { copyStaticForPages } from './scripts/copy-static-for-pages.js'
import { configureDevStatic } from './scripts/vite-dev-static.js'

// https://vitejs.dev/config/
let spaOutDir = ''
let projectRoot = ''
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'gh-pages-spa-404',
      configResolved(config) {
        projectRoot = config.root
        spaOutDir = resolve(config.root, config.build.outDir)
      },
      configureServer(server) {
        configureDevStatic(server)
      },
      closeBundle() {
        copyIndexTo404(spaOutDir)
        copyStaticForPages(spaOutDir, projectRoot)
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
      ignored: ['**/db/**', '**/node_modules/**'],
    },
  },
})

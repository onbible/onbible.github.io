import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/assets/libs/**', '**/vendor/**', '**/db/**', '**/node_modules/**'],
    },
  },
})

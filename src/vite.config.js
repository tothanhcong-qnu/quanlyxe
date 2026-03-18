import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
  },
  base: '/quanlyxe/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})

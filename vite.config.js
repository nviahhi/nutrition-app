import { defineConfig } from 'vite'

export default defineConfig({
  base: '/o/my-nutrition-app',
  build: {
    outDir: './vite-build',
    rollupOptions: {
      external: [
        /^(?!@clayui\/css)@clayui.*$/,
      ],
    }
  }
})

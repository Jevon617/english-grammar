import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  outDir: 'docs',
  base: '/english-grammar',
  build: {
    assets: 'assets'
  }
})

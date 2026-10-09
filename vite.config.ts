import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AronZero.github.io is a GitHub Pages *user* site, served from the domain root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // keep screenshots as real files so they cache and lazy-load
  },
});

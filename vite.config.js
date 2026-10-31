import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works at any GitHub Pages URL
  // (https://<user>.github.io/<repo>/) without knowing the repo name.
  base: './',
  build: {
    // StrataKit icons must stay external .svg files (they are referenced by URL fragment).
    assetsInlineLimit: (filePath) => !filePath.endsWith('.svg'),
  },
});

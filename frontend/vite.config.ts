import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Resolve the shared workspace package from its TS source. Its built `dist`
      // is CommonJS (the backend needs CJS), and Vite's dev server can't detect
      // named exports through the CJS `__exportStar` barrel. Pointing at source
      // makes it real ESM for the browser and gives instant HMR on shared edits.
      '@ecommerce/shared': fileURLToPath(
        new URL('../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
});

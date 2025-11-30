import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@cell-diagrams/core', '@cell-diagrams/renderer'],
    // Don't force re-optimization by default - use 'dev:clean' script if needed
  },
  server: {
    fs: {
      // Allow serving files from workspace packages
      allow: ['..'],
    },
  },
  build: {
    target: 'es2022',
  },
});

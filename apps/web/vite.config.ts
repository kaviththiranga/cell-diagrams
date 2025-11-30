import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Point to source files for workspace packages in dev mode
      // This enables instant HMR without needing to rebuild packages
      '@cell-diagrams/renderer/styles.css': resolve(__dirname, '../../packages/renderer/src/styles.css'),
      '@cell-diagrams/renderer': resolve(__dirname, '../../packages/renderer/src/index.ts'),
      '@cell-diagrams/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@cell-diagrams/collab-client': resolve(__dirname, '../../packages/collab-client/src/index.ts'),
    },
  },
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling (they're aliased to source)
    exclude: ['@cell-diagrams/core', '@cell-diagrams/renderer', '@cell-diagrams/collab-client'],
  },
  server: {
    fs: {
      // Allow serving files from workspace packages
      allow: ['../..'],
    },
  },
  build: {
    target: 'es2022',
  },
});

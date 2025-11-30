import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  external: ['vscode'],
  noExternal: ['@cell-diagrams/core'],
  minify: false,
});

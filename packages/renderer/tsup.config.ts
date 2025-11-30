import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['react', 'react-dom', '@xyflow/react'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: async () => {
    // Copy CSS file to dist
    mkdirSync(join(__dirname, 'dist'), { recursive: true });
    copyFileSync(
      join(__dirname, 'src/styles.css'),
      join(__dirname, 'dist/styles.css')
    );
    console.log('Copied styles.css to dist/');
  },
});

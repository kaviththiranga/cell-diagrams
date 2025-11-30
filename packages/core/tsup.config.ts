import { defineConfig } from 'tsup';

const isWatch = process.argv.includes('--watch');

export default defineConfig({
  entry: ['src/index.ts', 'src/grammar/lexer.ts'],
  format: ['esm'],
  dts: true,
  clean: !isWatch, // Don't clean in watch mode to avoid race conditions
  sourcemap: true,
  treeshake: true,
});

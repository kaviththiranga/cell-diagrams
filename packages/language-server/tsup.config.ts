import { defineConfig } from 'tsup';

const isWatch = process.argv.includes('--watch');

export default defineConfig([
  // Node.js bundle (main entry + stdio transport)
  {
    entry: {
      index: 'src/index.ts',
      'transport/stdio': 'src/transport/stdio.ts',
    },
    format: ['esm'],
    dts: true,
    clean: !isWatch,
    sourcemap: true,
    treeshake: true,
    target: 'node20',
    platform: 'node',
  },
  // Browser bundle (for Monaco integration)
  {
    entry: {
      'browser/index': 'src/browser/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    target: 'es2022',
    platform: 'browser',
    noExternal: ['vscode-languageserver-protocol'],
  },
]);

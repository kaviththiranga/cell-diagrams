/**
 * @cell-diagrams/language-server
 *
 * Language Server Protocol implementation for CellDL.
 * Provides IDE features including diagnostics, completions, hover,
 * go-to-definition, find references, rename, and formatting.
 */

// Server
export { createServer } from './server';
export { getServerCapabilities, semanticTokensLegend } from './capabilities';

// Documents
export { DocumentManager, type DocumentState } from './documents';
export * from './documents/position-utils';

// Analysis
export {
  buildSymbolTable,
  type SymbolTable,
  type Symbol,
  type SymbolReference,
  type SymbolKind,
} from './analysis';

// Services
export {
  computeDiagnostics,
  getCompletions,
  getHover,
  getDefinition,
  getReferences,
  getDocumentSymbols,
  prepareRename,
  performRename,
  formatDocument,
  formatRange,
} from './services';

// Transports
export { startStdioServer } from './transport';

// Version
export const VERSION = '0.1.0';

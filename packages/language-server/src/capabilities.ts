/**
 * LSP Server Capabilities
 *
 * Defines all capabilities supported by the CellDL language server.
 */

import {
  TextDocumentSyncKind,
  type ServerCapabilities,
  type SemanticTokensLegend,
} from 'vscode-languageserver';

/**
 * Semantic token types for CellDL
 */
export const semanticTokenTypes = [
  'namespace',     // workspace
  'type',          // cell, external, user, application
  'class',         // cell definitions
  'enum',          // types (logic, integration, data, etc.)
  'function',      // components
  'property',      // attributes
  'variable',      // identifiers in flows
  'string',        // string literals
  'number',        // number literals
  'keyword',       // keywords
  'comment',       // comments
  'operator',      // arrows, colons
] as const;

/**
 * Semantic token modifiers for CellDL
 */
export const semanticTokenModifiers = [
  'declaration',   // where symbol is defined
  'definition',    // definition site
  'readonly',      // built-in types
  'deprecated',    // legacy constructs
] as const;

/**
 * Semantic tokens legend for registration
 */
export const semanticTokensLegend: SemanticTokensLegend = {
  tokenTypes: [...semanticTokenTypes],
  tokenModifiers: [...semanticTokenModifiers],
};

/**
 * Get complete server capabilities
 */
export function getServerCapabilities(): ServerCapabilities {
  return {
    // Document synchronization
    textDocumentSync: {
      openClose: true,
      change: TextDocumentSyncKind.Incremental,
      save: {
        includeText: false,
      },
    },

    // Completion support
    completionProvider: {
      triggerCharacters: ['"', ':', '.', ' ', '{', '['],
      resolveProvider: true,
    },

    // Hover support
    hoverProvider: true,

    // Go-to-definition
    definitionProvider: true,

    // Find references
    referencesProvider: true,

    // Document symbols (outline)
    documentSymbolProvider: true,

    // Workspace symbols
    workspaceSymbolProvider: true,

    // Rename
    renameProvider: {
      prepareProvider: true,
    },

    // Formatting
    documentFormattingProvider: true,
    documentRangeFormattingProvider: true,

    // Code actions (quick fixes)
    codeActionProvider: {
      codeActionKinds: ['quickfix', 'refactor'],
    },

    // Semantic tokens for enhanced highlighting
    semanticTokensProvider: {
      legend: semanticTokensLegend,
      full: true,
      range: true,
    },
  };
}

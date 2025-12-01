/**
 * CellDL Language Server
 *
 * Core LSP server implementation that is transport-agnostic.
 */

import {
  type Connection,
  type InitializeParams,
  type InitializeResult,
  TextDocuments,
  type TextDocumentChangeEvent,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getServerCapabilities } from './capabilities';
import { DocumentManager } from './documents';
import {
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

/**
 * Create and configure the language server
 */
export function createServer(
  connection: Connection,
  documents: TextDocuments<TextDocument>
): void {
  const documentManager = new DocumentManager();

  // Initialize handler
  connection.onInitialize((_params: InitializeParams): InitializeResult => {
    connection.console.log('CellDL Language Server initializing...');

    return {
      capabilities: getServerCapabilities(),
      serverInfo: {
        name: 'CellDL Language Server',
        version: '0.1.0',
      },
    };
  });

  connection.onInitialized(() => {
    connection.console.log('CellDL Language Server initialized');
  });

  // Document synchronization
  documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    const state = documentManager.update(event.document);
    publishDiagnostics(connection, event.document.uri, state);
  });

  documents.onDidChangeContent((event: TextDocumentChangeEvent<TextDocument>) => {
    const state = documentManager.update(event.document);
    publishDiagnostics(connection, event.document.uri, state);
  });

  documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
    documentManager.remove(event.document.uri);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
  });

  // Completion
  connection.onCompletion((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const state = documentManager.getState(document);
    return getCompletions(document, params.position, state);
  });

  connection.onCompletionResolve((item) => {
    // Could add additional details here
    return item;
  });

  // Hover
  connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const state = documentManager.getState(document);
    return getHover(document, params.position, state);
  });

  // Go to definition
  connection.onDefinition((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const state = documentManager.getState(document);
    return getDefinition(document, params.position, state);
  });

  // Find references
  connection.onReferences((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const state = documentManager.getState(document);
    return getReferences(
      document,
      params.position,
      state,
      params.context.includeDeclaration
    );
  });

  // Document symbols
  connection.onDocumentSymbol((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const state = documentManager.getState(document);
    return getDocumentSymbols(state);
  });

  // Prepare rename
  connection.onPrepareRename((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const state = documentManager.getState(document);
    return prepareRename(document, params.position, state);
  });

  // Rename
  connection.onRenameRequest((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return null;

    const state = documentManager.getState(document);
    return performRename(document, params.position, params.newName, state);
  });

  // Document formatting
  connection.onDocumentFormatting((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const state = documentManager.getState(document);
    return formatDocument(document, params.options, state);
  });

  // Range formatting
  connection.onDocumentRangeFormatting((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const state = documentManager.getState(document);
    return formatRange(document, params.range, params.options, state);
  });

  // Workspace symbols
  connection.onWorkspaceSymbol(() => {
    // Collect symbols from all documents
    const symbols: import('vscode-languageserver').SymbolInformation[] = [];

    for (const state of documentManager.all()) {
      for (const symbol of state.symbolTable.symbols.values()) {
        const symbolInfo: import('vscode-languageserver').SymbolInformation = {
          name: symbol.name,
          kind: mapSymbolKind(symbol.kind),
          location: symbol.location,
        };
        if (symbol.scope) {
          symbolInfo.containerName = symbol.scope;
        }
        symbols.push(symbolInfo);
      }
    }

    return symbols;
  });

  // Listen for documents
  documents.listen(connection);
}

/**
 * Publish diagnostics to the client
 */
function publishDiagnostics(
  connection: Connection,
  uri: string,
  state: import('./documents').DocumentState
): void {
  const diagnostics = computeDiagnostics(state);
  connection.sendDiagnostics({ uri, diagnostics });
}

/**
 * Map CellDL symbol kind to LSP symbol kind
 */
function mapSymbolKind(
  kind: import('./analysis').SymbolKind
): import('vscode-languageserver').SymbolKind {
  const SymbolKind = {
    Class: 5,
    Method: 6,
    Interface: 11,
    Variable: 13,
    Constant: 14,
    Event: 24,
    Array: 18,
    Namespace: 3,
    Object: 19,
  } as const;

  switch (kind) {
    case 'cell':
      return SymbolKind.Class;
    case 'component':
      return SymbolKind.Method;
    case 'gateway':
      return SymbolKind.Interface;
    case 'user':
      return SymbolKind.Variable;
    case 'external':
      return SymbolKind.Constant;
    case 'flow':
      return SymbolKind.Event;
    case 'cluster':
      return SymbolKind.Array;
    case 'application':
      return SymbolKind.Namespace;
    default:
      return SymbolKind.Object;
  }
}

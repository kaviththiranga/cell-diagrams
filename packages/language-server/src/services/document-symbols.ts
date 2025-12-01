/**
 * Document Symbols Service
 *
 * Provides document outline (hierarchical symbols).
 */

import {
  DocumentSymbol,
  SymbolKind as LspSymbolKind,
} from 'vscode-languageserver';
import type { DocumentState } from '../documents';
import type { SymbolKind } from '../analysis';

/**
 * Get document symbols (outline) for a document
 */
export function getDocumentSymbols(state: DocumentState): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const symbolTable = state.symbolTable;

  // Group symbols by scope
  const topLevel = symbolTable.getTopLevelSymbols();
  const byScope = new Map<string, typeof topLevel>();

  for (const symbol of symbolTable.symbols.values()) {
    if (symbol.scope) {
      const scopeSymbols = byScope.get(symbol.scope) ?? [];
      scopeSymbols.push(symbol);
      byScope.set(symbol.scope, scopeSymbols);
    }
  }

  // Create hierarchical structure
  for (const symbol of topLevel) {
    const children = byScope.get(symbol.name) ?? [];

    const docSymbol: DocumentSymbol = {
      name: symbol.name,
      kind: mapSymbolKind(symbol.kind),
      range: symbol.range,
      selectionRange: symbol.range,
      detail: symbol.typeInfo ?? symbol.label,
      children: children.map((child) => ({
        name: child.name,
        kind: mapSymbolKind(child.kind),
        range: child.range,
        selectionRange: child.range,
        detail: child.typeInfo ?? child.label,
      })),
    };

    symbols.push(docSymbol);
  }

  return symbols;
}

/**
 * Map CellDL symbol kind to LSP symbol kind
 */
function mapSymbolKind(kind: SymbolKind): LspSymbolKind {
  switch (kind) {
    case 'cell':
      return LspSymbolKind.Class;
    case 'component':
      return LspSymbolKind.Method;
    case 'gateway':
      return LspSymbolKind.Interface;
    case 'user':
      return LspSymbolKind.Variable;
    case 'external':
      return LspSymbolKind.Constant;
    case 'flow':
      return LspSymbolKind.Event;
    case 'cluster':
      return LspSymbolKind.Array;
    case 'application':
      return LspSymbolKind.Namespace;
    default:
      return LspSymbolKind.Object;
  }
}

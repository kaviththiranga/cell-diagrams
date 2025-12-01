/**
 * Rename Service
 *
 * Provides safe symbol renaming with reference updates.
 */

import {
  WorkspaceEdit,
  TextEdit,
  type Position,
  type Range,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentState } from '../documents';
import { getWordAtPosition, getWordRangeAtPosition } from '../documents/position-utils';

/**
 * Prepare rename - check if renaming is valid at position
 */
export function prepareRename(
  document: TextDocument,
  position: Position,
  state: DocumentState
): { range: Range; placeholder: string } | null {
  const word = getWordAtPosition(document, position);
  if (!word) {
    return null;
  }

  const range = getWordRangeAtPosition(document, position);
  if (!range) {
    return null;
  }

  const symbolTable = state.symbolTable;

  // Check if this is a symbol we can rename
  const symbol = findSymbol(word, symbolTable);
  if (!symbol) {
    return null;
  }

  // Don't allow renaming built-in keywords
  if (isBuiltInKeyword(word)) {
    return null;
  }

  return {
    range,
    placeholder: word,
  };
}

/**
 * Perform rename - returns workspace edit with all changes
 */
export function performRename(
  document: TextDocument,
  position: Position,
  newName: string,
  state: DocumentState
): WorkspaceEdit | null {
  const word = getWordAtPosition(document, position);
  if (!word) {
    return null;
  }

  // Validate new name
  if (!isValidIdentifier(newName)) {
    return null;
  }

  const symbolTable = state.symbolTable;
  const uri = document.uri;

  // Find the symbol
  const symbol = findSymbol(word, symbolTable);
  if (!symbol) {
    return null;
  }

  const edits: TextEdit[] = [];

  // Add edit for the definition
  edits.push({
    range: symbol.range,
    newText: newName,
  });

  // Add edits for all references
  // Note: In a real implementation, we'd need to compute the exact range
  // for each reference. For now, we'll search the document text.
  const text = document.getText();
  const searchWord = symbol.name;

  // Find all occurrences of the word
  const wordRegex = new RegExp(`\\b${escapeRegex(searchWord)}\\b`, 'g');
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const start = document.positionAt(match.index);
    const end = document.positionAt(match.index + searchWord.length);

    // Skip if this is the definition (already added)
    if (
      start.line === symbol.range.start.line &&
      start.character === symbol.range.start.character
    ) {
      continue;
    }

    edits.push({
      range: { start, end },
      newText: newName,
    });
  }

  // If the symbol has a scope (e.g., component in a cell), also update
  // qualified references like "CellName.componentName"
  if (symbol.scope) {
    const qualifiedRegex = new RegExp(
      `\\b${escapeRegex(symbol.scope)}\\.${escapeRegex(searchWord)}\\b`,
      'g'
    );

    while ((match = qualifiedRegex.exec(text)) !== null) {
      // Calculate position for just the component name part
      const dotIndex = match[0].indexOf('.');
      const start = document.positionAt(match.index + dotIndex + 1);
      const end = document.positionAt(match.index + match[0].length);

      edits.push({
        range: { start, end },
        newText: newName,
      });
    }
  }

  return {
    changes: {
      [uri]: edits,
    },
  };
}

/**
 * Find a symbol in the symbol table
 */
function findSymbol(
  word: string,
  symbolTable: import('../analysis').SymbolTable
): import('../analysis').Symbol | undefined {
  // Try direct lookup
  const direct = symbolTable.symbols.get(word);
  if (direct) {
    return direct;
  }

  // Search by name
  for (const symbol of symbolTable.symbols.values()) {
    if (symbol.name === word) {
      return symbol;
    }
  }

  return undefined;
}

/**
 * Check if a word is a built-in keyword
 */
function isBuiltInKeyword(word: string): boolean {
  const keywords = [
    'workspace', 'cell', 'external', 'user', 'application', 'flow',
    'gateway', 'component', 'database', 'function', 'cluster',
    'ingress', 'egress', 'route',
    'logic', 'integration', 'data', 'security', 'channel', 'legacy',
    'microservice', 'broker', 'cache', 'idp', 'sts', 'userstore',
    'esb', 'adapter', 'transformer', 'webapp', 'mobile', 'iot',
    'https', 'http', 'grpc', 'tcp', 'mtls', 'kafka',
    'api', 'events', 'stream',
    'saas', 'partner', 'enterprise',
    'internal', 'system',
    'local-sts', 'federated',
    'label', 'type', 'description', 'replicas', 'protocol', 'port',
    'context', 'target', 'exposes', 'policies', 'auth', 'source',
    'engine', 'storage', 'version', 'env', 'provides', 'channels', 'cells',
    'ms', 'fn', 'db',
  ];

  return keywords.includes(word.toLowerCase());
}

/**
 * Check if a string is a valid CellDL identifier
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

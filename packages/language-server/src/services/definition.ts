/**
 * Definition Service
 *
 * Provides go-to-definition for symbols.
 */

import { type Location, type Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentState } from '../documents';
import { getWordAtPosition, getLineText } from '../documents/position-utils';

/**
 * Get definition location for a symbol at position
 */
export function getDefinition(
  document: TextDocument,
  position: Position,
  state: DocumentState
): Location | null {
  const word = getWordAtPosition(document, position);
  if (!word) {
    return null;
  }

  const symbolTable = state.symbolTable;

  // Check context to determine scope
  const scope = determineScope(document, position);

  // Try qualified lookup first
  if (scope) {
    const qualifiedName = `${scope}.${word}`;
    const symbol = symbolTable.symbols.get(qualifiedName);
    if (symbol) {
      return symbol.location;
    }
  }

  // Try direct lookup
  const symbol = symbolTable.symbols.get(word);
  if (symbol) {
    return symbol.location;
  }

  // Search by name in all symbols
  for (const sym of symbolTable.symbols.values()) {
    if (sym.name === word) {
      return sym.location;
    }
  }

  return null;
}

/**
 * Determine the scope context at a position
 */
function determineScope(document: TextDocument, position: Position): string | undefined {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const textBefore = text.slice(0, offset);

  // Check for qualified reference (Cell.component)
  const line = getLineText(document, position.line);
  const beforeCursor = line.slice(0, position.character);

  // Look for "CellName." pattern before the word
  const dotMatch = beforeCursor.match(/(\w+)\.$/);
  if (dotMatch) {
    return dotMatch[1];
  }

  // Find enclosing cell block
  const cellMatch = textBefore.match(/cell\s+(\w+)[^{]*\{[^}]*$/);
  if (cellMatch) {
    return cellMatch[1];
  }

  return undefined;
}

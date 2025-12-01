/**
 * References Service
 *
 * Provides find-all-references for symbols.
 */

import { type Location, type Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentState } from '../documents';
import { getWordAtPosition } from '../documents/position-utils';

/**
 * Find all references to a symbol at position
 */
export function getReferences(
  document: TextDocument,
  position: Position,
  state: DocumentState,
  includeDeclaration: boolean = true
): Location[] {
  const word = getWordAtPosition(document, position);
  if (!word) {
    return [];
  }

  const symbolTable = state.symbolTable;
  const locations: Location[] = [];

  // Find the symbol
  let symbol = symbolTable.symbols.get(word);

  // Search by name if not found directly
  if (!symbol) {
    for (const sym of symbolTable.symbols.values()) {
      if (sym.name === word) {
        symbol = sym;
        break;
      }
    }
  }

  if (!symbol) {
    return [];
  }

  // Include definition if requested
  if (includeDeclaration) {
    locations.push(symbol.location);
  }

  // Add all references
  locations.push(...symbol.references);

  return locations;
}

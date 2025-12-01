/**
 * Position Utilities
 *
 * Helpers for converting between LSP positions, AST locations, and offsets.
 */

import type { Position, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { Location as AstLocation, Position as AstPosition } from '@cell-diagrams/core';

/**
 * Convert AST position (1-based) to LSP position (0-based)
 */
export function astPositionToLsp(pos: AstPosition): Position {
  return {
    line: pos.line - 1,
    character: pos.column - 1,
  };
}

/**
 * Convert LSP position (0-based) to AST position (1-based)
 */
export function lspPositionToAst(pos: Position, document: TextDocument): AstPosition {
  return {
    line: pos.line + 1,
    column: pos.character + 1,
    offset: document.offsetAt(pos),
  };
}

/**
 * Convert AST location to LSP range
 */
export function astLocationToRange(loc: AstLocation): Range {
  return {
    start: astPositionToLsp(loc.start),
    end: astPositionToLsp(loc.end),
  };
}

/**
 * Create an LSP range from line/column info (1-based to 0-based)
 */
export function createRange(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): Range {
  return {
    start: { line: startLine - 1, character: startColumn - 1 },
    end: { line: endLine - 1, character: endColumn - 1 },
  };
}

/**
 * Get the word at a position in a document
 */
export function getWordAtPosition(document: TextDocument, position: Position): string | undefined {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Find word boundaries
  let start = offset;
  let end = offset;

  // Move start back to word beginning
  while (start > 0 && isWordChar(text[start - 1]!)) {
    start--;
  }

  // Move end forward to word end
  while (end < text.length && isWordChar(text[end]!)) {
    end++;
  }

  if (start === end) {
    return undefined;
  }

  return text.slice(start, end);
}

/**
 * Get the range of the word at a position
 */
export function getWordRangeAtPosition(document: TextDocument, position: Position): Range | undefined {
  const text = document.getText();
  const offset = document.offsetAt(position);

  let start = offset;
  let end = offset;

  while (start > 0 && isWordChar(text[start - 1]!)) {
    start--;
  }

  while (end < text.length && isWordChar(text[end]!)) {
    end++;
  }

  if (start === end) {
    return undefined;
  }

  return {
    start: document.positionAt(start),
    end: document.positionAt(end),
  };
}

/**
 * Check if a character is part of an identifier
 */
function isWordChar(char: string): boolean {
  return /[a-zA-Z0-9_-]/.test(char);
}

/**
 * Check if a position is inside a range
 */
export function isInsideRange(position: Position, range: Range): boolean {
  if (position.line < range.start.line || position.line > range.end.line) {
    return false;
  }
  if (position.line === range.start.line && position.character < range.start.character) {
    return false;
  }
  if (position.line === range.end.line && position.character > range.end.character) {
    return false;
  }
  return true;
}

/**
 * Get the line text at a position
 */
export function getLineText(document: TextDocument, line: number): string {
  const text = document.getText();
  const lines = text.split('\n');
  return lines[line] ?? '';
}

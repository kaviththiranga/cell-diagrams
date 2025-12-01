/**
 * Formatting Service
 *
 * Provides document formatting using the core stringify function.
 */

import { TextEdit, type FormattingOptions, type Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { stringify, type StringifyOptions } from '@cell-diagrams/core';
import type { DocumentState } from '../documents';

/**
 * Format an entire document
 */
export function formatDocument(
  document: TextDocument,
  options: FormattingOptions,
  state: DocumentState
): TextEdit[] {
  // Only format if the AST is complete (no error nodes)
  if (!state.parseResult.isComplete) {
    // Return empty edits if there are errors
    return [];
  }

  // Build indent string based on LSP options
  const indentChar = options.insertSpaces ? ' ' : '\t';
  const indentSize = options.insertSpaces ? options.tabSize : 1;
  const indent = indentChar.repeat(indentSize);

  const stringifyOptions: StringifyOptions = {
    indent,
  };

  try {
    const formatted = stringify(state.parseResult.ast, stringifyOptions);

    // Get full document range
    const fullRange: Range = {
      start: { line: 0, character: 0 },
      end: document.positionAt(document.getText().length),
    };

    return [
      {
        range: fullRange,
        newText: formatted,
      },
    ];
  } catch {
    // If formatting fails, return no edits
    return [];
  }
}

/**
 * Format a range within a document
 */
export function formatRange(
  document: TextDocument,
  _range: Range,
  options: FormattingOptions,
  state: DocumentState
): TextEdit[] {
  // For range formatting, we'll format the whole document
  // and extract the relevant portion
  // This is a simplified implementation - a full implementation
  // would parse and format just the selected range

  // Only format if the AST is complete
  if (!state.parseResult.isComplete) {
    return [];
  }

  // For now, just format the whole document
  return formatDocument(document, options, state);
}

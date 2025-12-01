/**
 * Diagnostics Service
 *
 * Converts parse errors and semantic errors to LSP diagnostics.
 */

import {
  Diagnostic,
  DiagnosticSeverity,
  type DiagnosticTag,
} from 'vscode-languageserver';
import type { EnhancedParseError, ErrorSeverity } from '@cell-diagrams/core';
import type { DocumentState } from '../documents';
import type { SymbolTable, Symbol } from '../analysis';

/**
 * Compute diagnostics for a document
 */
export function computeDiagnostics(state: DocumentState): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Add parse errors
  for (const error of state.parseResult.errors) {
    diagnostics.push(parseErrorToDiagnostic(error));
  }

  // Add semantic errors
  const semanticErrors = computeSemanticDiagnostics(state);
  diagnostics.push(...semanticErrors);

  return diagnostics;
}

/**
 * Convert an enhanced parse error to an LSP diagnostic
 */
function parseErrorToDiagnostic(error: EnhancedParseError): Diagnostic {
  const diagnostic: Diagnostic = {
    range: {
      start: { line: error.line - 1, character: error.column - 1 },
      end: { line: error.endLine - 1, character: error.endColumn - 1 },
    },
    severity: mapSeverity(error.severity),
    code: error.code,
    source: 'CellDL',
    message: error.message,
  };

  // Add recovery hint as related information
  if (error.recoveryHint) {
    diagnostic.message += `\n\nHint: ${error.recoveryHint}`;
  }

  // Add suggested fix data for code actions
  if (error.suggestedFix) {
    diagnostic.data = {
      suggestedFix: error.suggestedFix,
    };
  }

  return diagnostic;
}

/**
 * Compute semantic diagnostics (undefined references, duplicates)
 */
function computeSemanticDiagnostics(state: DocumentState): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const symbolTable = state.symbolTable;

  // Check for duplicate definitions
  const duplicates = findDuplicateDefinitions(symbolTable);
  for (const dup of duplicates) {
    diagnostics.push({
      range: dup.range,
      severity: DiagnosticSeverity.Warning,
      code: 5002, // DUPLICATE_IDENTIFIER
      source: 'CellDL',
      message: `Duplicate definition of '${dup.name}'`,
      tags: [2 as DiagnosticTag], // DiagnosticTag.Unnecessary
    });
  }

  // Check for undefined references in flows
  const undefinedRefs = findUndefinedReferences(state);
  for (const ref of undefinedRefs) {
    diagnostics.push({
      range: ref.range,
      severity: DiagnosticSeverity.Error,
      code: 5001, // UNDEFINED_REFERENCE
      source: 'CellDL',
      message: `Undefined reference '${ref.name}'`,
    });
  }

  return diagnostics;
}

/**
 * Find duplicate symbol definitions
 */
function findDuplicateDefinitions(
  symbolTable: SymbolTable
): Array<{ name: string; range: import('vscode-languageserver').Range }> {
  const seen = new Map<string, Symbol>();
  const duplicates: Array<{ name: string; range: import('vscode-languageserver').Range }> = [];

  for (const symbol of symbolTable.symbols.values()) {
    const key = symbol.scope ? `${symbol.scope}.${symbol.name}` : symbol.name;
    const existing = seen.get(key);

    if (existing) {
      duplicates.push({ name: symbol.name, range: symbol.range });
    } else {
      seen.set(key, symbol);
    }
  }

  return duplicates;
}

/**
 * Find undefined references
 */
function findUndefinedReferences(
  state: DocumentState
): Array<{ name: string; range: import('vscode-languageserver').Range }> {
  const undefined_refs: Array<{ name: string; range: import('vscode-languageserver').Range }> = [];
  const symbolTable = state.symbolTable;

  for (const ref of symbolTable.references) {
    const qualifiedName = ref.scope ? `${ref.scope}.${ref.name}` : ref.name;

    // Skip built-in references like "user"
    if (ref.name === 'user') continue;

    // Try to find the symbol
    const symbol =
      symbolTable.symbols.get(qualifiedName) ?? symbolTable.symbols.get(ref.name);

    if (!symbol) {
      undefined_refs.push({ name: ref.name, range: ref.range });
    }
  }

  return undefined_refs;
}

/**
 * Map error severity to LSP diagnostic severity
 */
function mapSeverity(severity: ErrorSeverity): DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    case 'info':
      return DiagnosticSeverity.Information;
    default:
      return DiagnosticSeverity.Error;
  }
}

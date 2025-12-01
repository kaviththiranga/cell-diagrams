/**
 * CellDL Error Collector
 *
 * Aggregates, deduplicates, and organizes errors from lexing and parsing.
 * Provides sorted, prioritized error lists for IDE display.
 */

import type { IToken, ILexingError, IRecognitionException } from 'chevrotain';
import {
  EnhancedParseError,
  ErrorCodeType,
  ErrorSeverity,
  ErrorCategory,
  getErrorCategory,
  getErrorSeverity,
} from './types';
import { convertRecognitionException, convertLexerError } from './messages';
import { getRecoveryHint, getSuggestedFix } from './recovery';

// ============================================
// Error Collector Class
// ============================================

/**
 * Collects and organizes parse errors for IDE integration.
 * Features:
 * - Deduplication of errors at same location
 * - Sorting by severity and location
 * - Grouping by region for IDE display
 */
export class ErrorCollector {
  private errors: Map<string, EnhancedParseError> = new Map();
  private ruleStack: string[] = [];
  private source: string = '';

  /**
   * Create a new error collector
   */
  constructor(source?: string) {
    if (source) {
      this.source = source;
    }
  }

  /**
   * Set the source code for context
   */
  setSource(source: string): void {
    this.source = source;
  }

  /**
   * Clear all collected errors
   */
  clear(): void {
    this.errors.clear();
    this.ruleStack = [];
  }

  // ========================================
  // Rule Stack Tracking
  // ========================================

  /**
   * Enter a grammar rule (for context tracking)
   */
  enterRule(ruleName: string): void {
    this.ruleStack.push(ruleName);
  }

  /**
   * Exit a grammar rule
   */
  exitRule(): void {
    this.ruleStack.pop();
  }

  /**
   * Get the current rule name
   */
  getCurrentRule(): string | undefined {
    return this.ruleStack[this.ruleStack.length - 1];
  }

  // ========================================
  // Error Addition
  // ========================================

  /**
   * Generate a unique key for an error (for deduplication)
   */
  private getErrorKey(error: EnhancedParseError): string {
    return `${error.line}:${error.column}:${error.code}`;
  }

  /**
   * Add a single error
   */
  addError(error: EnhancedParseError): void {
    const key = this.getErrorKey(error);

    // If we already have an error at this location, keep the one with more context
    const existing = this.errors.get(key);
    if (existing) {
      // Prefer errors with suggested fixes
      if (!existing.suggestedFix && error.suggestedFix) {
        this.errors.set(key, error);
      }
      // Prefer errors with recovery hints
      else if (!existing.recoveryHint && error.recoveryHint) {
        this.errors.set(key, error);
      }
      // Prefer errors with more expected tokens
      else if (
        (existing.expectedTokens?.length ?? 0) < (error.expectedTokens?.length ?? 0)
      ) {
        this.errors.set(key, error);
      }
    } else {
      this.errors.set(key, error);
    }
  }

  /**
   * Add errors from lexer
   */
  addLexerErrors(lexErrors: ILexingError[]): void {
    for (const error of lexErrors) {
      const enhanced = convertLexerError({
        message: error.message,
        line: error.line ?? 1,
        column: error.column ?? 1,
        offset: error.offset,
        length: error.length,
      });
      this.addError(enhanced);
    }
  }

  /**
   * Add errors from parser with token context
   */
  addParserErrors(parserErrors: IRecognitionException[], tokens: IToken[]): void {
    for (const exception of parserErrors) {
      let enhanced = convertRecognitionException(exception, tokens);

      // Try to enhance with pattern-based recovery hints
      const errorToken = exception.token;
      const tokenIndex = tokens.findIndex(
        (t) => t.startOffset === errorToken.startOffset
      );

      if (tokenIndex >= 0) {
        const currentRule = this.getCurrentRule();
        const hint = getRecoveryHint(tokens, tokenIndex, currentRule, this.source);
        const fix = getSuggestedFix(tokens, tokenIndex, currentRule, this.source);

        if (hint && !enhanced.recoveryHint) {
          enhanced = { ...enhanced, recoveryHint: hint };
        }
        if (fix && !enhanced.suggestedFix) {
          enhanced = { ...enhanced, suggestedFix: fix };
        }
      }

      this.addError(enhanced);
    }
  }

  /**
   * Add a custom error
   */
  addCustomError(
    code: ErrorCodeType,
    message: string,
    location: {
      line: number;
      column: number;
      offset: number;
      length: number;
    },
    options?: {
      recoveryHint?: string | undefined;
      ruleName?: string | undefined;
    }
  ): void {
    const enhanced: EnhancedParseError = {
      code,
      category: getErrorCategory(code),
      severity: getErrorSeverity(code),
      message,
      line: location.line,
      column: location.column,
      endLine: location.line,
      endColumn: location.column + location.length,
      offset: location.offset,
      length: location.length,
    };

    if (options?.recoveryHint) {
      enhanced.recoveryHint = options.recoveryHint;
    }
    const ruleName = options?.ruleName ?? this.getCurrentRule();
    if (ruleName) {
      enhanced.ruleName = ruleName;
    }

    this.addError(enhanced);
  }

  // ========================================
  // Error Retrieval
  // ========================================

  /**
   * Get all collected errors, sorted and deduplicated
   */
  getErrors(): EnhancedParseError[] {
    const errors = Array.from(this.errors.values());

    // Sort by: severity (errors first), then line, then column
    errors.sort((a, b) => {
      // Severity order: error > warning > info
      const severityOrder: Record<ErrorSeverity, number> = {
        error: 0,
        warning: 1,
        info: 2,
      };

      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by line
      const lineDiff = a.line - b.line;
      if (lineDiff !== 0) return lineDiff;

      // Then by column
      return a.column - b.column;
    });

    return errors;
  }

  /**
   * Get only errors (no warnings/info)
   */
  getErrorsOnly(): EnhancedParseError[] {
    return this.getErrors().filter((e) => e.severity === 'error');
  }

  /**
   * Get errors grouped by line
   */
  getErrorsByLine(): Map<number, EnhancedParseError[]> {
    const byLine = new Map<number, EnhancedParseError[]>();

    for (const error of this.getErrors()) {
      const existing = byLine.get(error.line) ?? [];
      existing.push(error);
      byLine.set(error.line, existing);
    }

    return byLine;
  }

  /**
   * Get errors grouped by category
   */
  getErrorsByCategory(): Map<ErrorCategory, EnhancedParseError[]> {
    const byCategory = new Map<ErrorCategory, EnhancedParseError[]>();

    for (const error of this.getErrors()) {
      const existing = byCategory.get(error.category) ?? [];
      existing.push(error);
      byCategory.set(error.category, existing);
    }

    return byCategory;
  }

  /**
   * Get errors in a specific line range
   */
  getErrorsInRange(startLine: number, endLine: number): EnhancedParseError[] {
    return this.getErrors().filter(
      (e) => e.line >= startLine && e.line <= endLine
    );
  }

  /**
   * Get the first error (most important)
   */
  getFirstError(): EnhancedParseError | undefined {
    const errors = this.getErrors();
    return errors[0];
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errors.size;
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  /**
   * Check if there are any errors with severity 'error'
   */
  hasFatalErrors(): boolean {
    return Array.from(this.errors.values()).some((e) => e.severity === 'error');
  }

  // ========================================
  // IDE Integration Helpers
  // ========================================

  /**
   * Convert errors to VS Code diagnostic format
   */
  toVSCodeDiagnostics(): Array<{
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    message: string;
    severity: 1 | 2 | 3 | 4;
    code: number;
    source: string;
  }> {
    const severityMap: Record<ErrorSeverity, 1 | 2 | 3 | 4> = {
      error: 1, // Error
      warning: 2, // Warning
      info: 3, // Information
    };

    return this.getErrors().map((error) => ({
      range: {
        start: { line: error.line - 1, character: error.column - 1 },
        end: { line: error.endLine - 1, character: error.endColumn - 1 },
      },
      message: error.recoveryHint
        ? `${error.message}\n\nHint: ${error.recoveryHint}`
        : error.message,
      severity: severityMap[error.severity],
      code: error.code,
      source: 'CellDL',
    }));
  }

  /**
   * Convert errors to Monaco editor marker format
   */
  toMonacoMarkers(): Array<{
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    message: string;
    severity: 8 | 4 | 2 | 1;
    code: string;
  }> {
    const severityMap: Record<ErrorSeverity, 8 | 4 | 2 | 1> = {
      error: 8, // MarkerSeverity.Error
      warning: 4, // MarkerSeverity.Warning
      info: 2, // MarkerSeverity.Info
    };

    return this.getErrors().map((error) => ({
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.endLine,
      endColumn: error.endColumn,
      message: error.recoveryHint
        ? `${error.message}\n\nHint: ${error.recoveryHint}`
        : error.message,
      severity: severityMap[error.severity],
      code: String(error.code),
    }));
  }

  /**
   * Format errors as a human-readable string
   */
  format(): string {
    const errors = this.getErrors();
    if (errors.length === 0) return '';

    const lines: string[] = [];

    for (const error of errors) {
      const prefix =
        error.severity === 'error'
          ? 'ERROR'
          : error.severity === 'warning'
            ? 'WARN '
            : 'INFO ';

      lines.push(`${prefix} [${error.line}:${error.column}] ${error.message}`);

      if (error.recoveryHint) {
        lines.push(`       Hint: ${error.recoveryHint}`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a pre-configured error collector
 */
export function createErrorCollector(source?: string): ErrorCollector {
  return new ErrorCollector(source);
}

/**
 * Quick function to collect all errors from lexer and parser
 */
export function collectAllErrors(
  lexErrors: ILexingError[],
  parserErrors: IRecognitionException[],
  tokens: IToken[],
  source?: string
): EnhancedParseError[] {
  const collector = new ErrorCollector(source);
  collector.addLexerErrors(lexErrors);
  collector.addParserErrors(parserErrors, tokens);
  return collector.getErrors();
}

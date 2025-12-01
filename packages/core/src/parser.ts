/**
 * Cell Diagrams Parser API
 *
 * Main entry point for parsing Cell Diagrams DSL source code.
 * Includes both standard parsing and enhanced error-recovery parsing for IDEs.
 */

import { CellDiagramsLexer } from './grammar/lexer';
import { parserInstance } from './grammar/parser';
import { visitorInstance } from './grammar/visitor';
import { Program } from './ast/types';
import {
  EnhancedParseError,
  EnhancedParseResult,
  ErrorCollector,
  visitProgramWithRecovery,
  countErrorNodes,
  getVisitorErrors,
  resetVisitorErrors,
} from './errors';

// ============================================
// Types
// ============================================

export interface ParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
  length: number;
}

export interface ParseResult {
  /** The parsed AST, or null if there were errors */
  ast: Program | null;
  /** Array of parse errors */
  errors: ParseError[];
  /** Whether parsing succeeded without errors */
  success: boolean;
}

// ============================================
// Parse Functions
// ============================================

/**
 * Parse Cell Diagrams DSL source code into an AST.
 *
 * @param source - The DSL source code to parse
 * @returns ParseResult containing the AST and any errors
 *
 * @example
 * ```typescript
 * const result = parse(`
 *   cell OrderCell {
 *     name: "Order Management"
 *     components {
 *       ms OrderService
 *     }
 *   }
 * `);
 *
 * if (result.success) {
 *   console.log(result.ast);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function parse(source: string): ParseResult {
  const errors: ParseError[] = [];

  // Step 1: Tokenize
  const lexResult = CellDiagramsLexer.tokenize(source);

  // Collect lexer errors
  for (const error of lexResult.errors) {
    errors.push({
      message: error.message,
      line: error.line ?? 1,
      column: error.column ?? 1,
      offset: error.offset,
      length: error.length,
    });
  }

  // Step 2: Parse tokens into CST
  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.program();

  // Collect parser errors
  for (const error of parserInstance.errors) {
    errors.push({
      message: error.message,
      line: error.token.startLine ?? 1,
      column: error.token.startColumn ?? 1,
      offset: error.token.startOffset,
      length: (error.token.endOffset ?? error.token.startOffset) - error.token.startOffset + 1,
    });
  }

  // If there are errors, return with null AST
  if (errors.length > 0) {
    return {
      ast: null,
      errors,
      success: false,
    };
  }

  // Step 3: Transform CST to AST
  const ast = visitorInstance.visit(cst) as Program;

  return {
    ast,
    errors: [],
    success: true,
  };
}

/**
 * Parse source code and throw on error.
 * Useful when you expect the input to be valid.
 *
 * @param source - The DSL source code to parse
 * @returns The parsed AST
 * @throws Error if parsing fails
 */
export function parseOrThrow(source: string): Program {
  const result = parse(source);

  if (!result.success) {
    const errorMessages = result.errors
      .map((e) => `  Line ${e.line}:${e.column}: ${e.message}`)
      .join('\n');
    throw new Error(`Parse errors:\n${errorMessages}`);
  }

  return result.ast!;
}

/**
 * Validate source code without fully parsing.
 * Faster than full parse when you only need to check for errors.
 *
 * @param source - The DSL source code to validate
 * @returns Array of parse errors (empty if valid)
 */
export function validate(source: string): ParseError[] {
  const result = parse(source);
  return result.errors;
}

// ============================================
// Enhanced Parse Functions (with Error Recovery)
// ============================================

/**
 * Parse with full error recovery - always returns an AST.
 *
 * This function is designed for IDE integration where partial AST
 * is useful even when there are syntax errors. It provides:
 * - Detailed error messages with recovery hints
 * - Suggested fixes for common mistakes
 * - ErrorNodes in the AST where parsing failed
 *
 * @param source - The DSL source code to parse
 * @returns EnhancedParseResult with AST (may contain ErrorNodes) and detailed errors
 *
 * @example
 * ```typescript
 * const result = parseWithRecovery(`
 *   cell "Order" type:logic {
 *     // Missing closing brace
 * `);
 *
 * // AST is always available for IDE features
 * console.log(result.ast);
 *
 * // Errors have hints and suggested fixes
 * for (const error of result.errors) {
 *   console.log(`${error.message}`);
 *   if (error.recoveryHint) {
 *     console.log(`  Hint: ${error.recoveryHint}`);
 *   }
 *   if (error.suggestedFix) {
 *     console.log(`  Fix: ${error.suggestedFix.description}`);
 *   }
 * }
 * ```
 */
export function parseWithRecovery(source: string): EnhancedParseResult {
  // Create error collector
  const errorCollector = new ErrorCollector(source);

  // Step 1: Tokenize
  const lexResult = CellDiagramsLexer.tokenize(source);

  // Collect lexer errors with enhanced info
  errorCollector.addLexerErrors(lexResult.errors);

  // Step 2: Parse tokens into CST
  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.program();

  // Collect parser errors with enhanced info
  errorCollector.addParserErrors(parserInstance.errors, lexResult.tokens);

  // Step 3: Transform CST to AST with error tolerance
  // This will produce ErrorNodes where parsing failed
  resetVisitorErrors();
  let ast: Program;

  try {
    // First try the error-tolerant visitor
    ast = visitProgramWithRecovery(cst);
  } catch {
    // If that fails completely, try the standard visitor
    try {
      ast = visitorInstance.visit(cst) as Program;
    } catch {
      // Last resort: return minimal program with error
      ast = {
        type: 'Program',
        properties: [],
        statements: [],
      };
    }
  }

  // Collect any errors from the visitor
  const visitorErrors = getVisitorErrors();
  for (const error of visitorErrors) {
    errorCollector.addError(error);
  }

  // Get all collected errors
  const errors = errorCollector.getErrors();

  // Count ErrorNodes in the AST
  const errorNodeCount = countErrorNodes(ast);

  return {
    ast,
    errors,
    success: errors.length === 0,
    isComplete: errorNodeCount === 0,
    errorNodeCount,
  };
}

/**
 * Validate source code with enhanced error details.
 *
 * @param source - The DSL source code to validate
 * @returns Array of enhanced parse errors with hints and suggested fixes
 */
export function validateWithRecovery(source: string): EnhancedParseError[] {
  const result = parseWithRecovery(source);
  return result.errors;
}

// Re-export enhanced types for convenience
export type { EnhancedParseError, EnhancedParseResult } from './errors';

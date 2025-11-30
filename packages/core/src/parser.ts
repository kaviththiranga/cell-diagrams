/**
 * Cell Diagrams Parser API
 *
 * Main entry point for parsing Cell Diagrams DSL source code.
 */

import { CellDiagramsLexer } from './grammar/lexer';
import { parserInstance } from './grammar/parser';
import { visitorInstance } from './grammar/visitor';
import { Program } from './ast/types';

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

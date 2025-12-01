/**
 * Error-Tolerant CST Visitor
 *
 * Wraps the standard visitor to catch exceptions and produce partial ASTs
 * with ErrorNodes where parsing failed.
 */

import { CstNode, IToken } from 'chevrotain';
import { visitorInstance } from '../grammar/visitor';
import {
  Program,
  Statement,
  CellDefinition,
  ErrorNode,
} from '../ast/types';
import { ErrorCode, ErrorCodeType, EnhancedParseError, createEnhancedError } from './types';

// ============================================
// Error Tracking
// ============================================

/** Errors collected during visitor traversal */
let visitorErrors: EnhancedParseError[] = [];

/**
 * Reset the visitor error collector
 */
export function resetVisitorErrors(): void {
  visitorErrors = [];
}

/**
 * Get all errors collected during visitor traversal
 */
export function getVisitorErrors(): EnhancedParseError[] {
  return [...visitorErrors];
}

/**
 * Add an error to the visitor error collection
 */
function addVisitorError(error: EnhancedParseError): void {
  visitorErrors.push(error);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract location info from a CST node
 */
function getLocationFromCst(ctx: CstNode | Record<string, unknown>): {
  line: number;
  column: number;
  offset: number;
  length: number;
} {
  // Try to find the first token in the context for location
  const firstToken = findFirstToken(ctx);
  if (firstToken) {
    return {
      line: firstToken.startLine ?? 1,
      column: firstToken.startColumn ?? 1,
      offset: firstToken.startOffset,
      length: firstToken.image?.length ?? 1,
    };
  }

  // Default location
  return { line: 1, column: 1, offset: 0, length: 1 };
}

/**
 * Find the first token in a CST context
 */
function findFirstToken(ctx: unknown): IToken | undefined {
  if (!ctx || typeof ctx !== 'object') return undefined;

  const obj = ctx as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        // Check if it's a token (has startOffset)
        if (item && typeof item === 'object' && 'startOffset' in item) {
          return item as IToken;
        }
        // Check if it's a CST node (has name and children)
        if (item && typeof item === 'object' && 'children' in item) {
          const found = findFirstToken((item as CstNode).children);
          if (found) return found;
        }
      }
    }
  }

  return undefined;
}

/**
 * Create an ErrorNode from an error
 */
function createErrorNode(
  code: ErrorCodeType,
  message: string,
  ruleName: string,
  location: { line: number; column: number; offset: number; length: number },
  hint?: string | undefined,
  partialData?: Record<string, unknown> | undefined
): ErrorNode {
  // Also add to the error collection
  addVisitorError(
    createEnhancedError(code, message, location, {
      ruleName,
      recoveryHint: hint,
    })
  );

  const node: ErrorNode = {
    type: 'ErrorNode',
    errorCode: code,
    message,
    ruleName,
    location: {
      start: { line: location.line, column: location.column, offset: location.offset },
      end: {
        line: location.line,
        column: location.column + location.length,
        offset: location.offset + location.length,
      },
    },
  };

  if (hint) node.recoveryHint = hint;
  if (partialData) node.partialData = partialData;

  return node;
}

// ============================================
// Safe Visit Functions
// ============================================

/**
 * Safely visit a CST node, returning an ErrorNode on failure
 */
export function safeVisit<T>(
  node: CstNode | undefined,
  ruleName: string,
  _fallback?: T | (() => T)
): T | ErrorNode {
  if (!node) {
    const location = { line: 1, column: 1, offset: 0, length: 1 };
    return createErrorNode(
      ErrorCode.NO_VIABLE_ALTERNATIVE,
      `Missing ${ruleName}`,
      ruleName,
      location,
      `Expected a ${ruleName} definition`
    );
  }

  try {
    return visitorInstance.visit(node) as T;
  } catch (error) {
    const location = getLocationFromCst(node.children ?? {});
    const message = error instanceof Error ? error.message : String(error);

    return createErrorNode(
      ErrorCode.UNKNOWN_ERROR,
      `Error parsing ${ruleName}: ${message}`,
      ruleName,
      location,
      undefined,
      { raw: node }
    );
  }
}

/**
 * Safely visit multiple CST nodes, filtering out errors if needed
 */
export function safeVisitMany<T>(
  nodes: CstNode[] | undefined,
  ruleName: string
): (T | ErrorNode)[] {
  if (!nodes || nodes.length === 0) return [];

  const results: (T | ErrorNode)[] = [];

  for (const node of nodes) {
    try {
      const result = visitorInstance.visit(node) as T;
      if (result !== null && result !== undefined) {
        results.push(result);
      }
    } catch (error) {
      const location = getLocationFromCst(node.children ?? {});
      const message = error instanceof Error ? error.message : String(error);

      results.push(
        createErrorNode(
          ErrorCode.UNKNOWN_ERROR,
          `Error parsing ${ruleName}: ${message}`,
          ruleName,
          location
        )
      );
    }
  }

  return results;
}

// ============================================
// Error-Tolerant Program Visitor
// ============================================

/**
 * Visit the program CST with error tolerance.
 * Returns a Program with ErrorNodes where parsing failed.
 */
export function visitProgramWithRecovery(cst: CstNode): Program {
  resetVisitorErrors();

  try {
    // Try normal visit first
    const result = visitorInstance.visit(cst) as Program;

    // If successful, return as-is
    return result;
  } catch (error) {
    // If the visit fails completely, create a minimal program with error
    const location = getLocationFromCst(cst.children ?? {});
    const message = error instanceof Error ? error.message : String(error);

    const errorNode = createErrorNode(
      ErrorCode.UNKNOWN_ERROR,
      `Failed to parse program: ${message}`,
      'program',
      location,
      'Check your syntax and try again'
    );

    return {
      type: 'Program',
      properties: [],
      statements: [errorNode],
    };
  }
}

/**
 * Visit statements with error tolerance.
 * Processes each statement individually to maximize recovery.
 */
export function visitStatementsWithRecovery(
  statementNodes: CstNode[] | undefined
): Statement[] {
  if (!statementNodes || statementNodes.length === 0) return [];

  const statements: Statement[] = [];

  for (const node of statementNodes) {
    try {
      const stmt = visitorInstance.visit(node) as Statement | null;
      if (stmt) {
        statements.push(stmt);
      }
    } catch (error) {
      const location = getLocationFromCst(node.children ?? {});
      const message = error instanceof Error ? error.message : String(error);

      statements.push(
        createErrorNode(
          ErrorCode.UNKNOWN_ERROR,
          `Error in statement: ${message}`,
          'statement',
          location
        )
      );
    }
  }

  return statements;
}

// ============================================
// Error Node Utilities
// ============================================

/**
 * Count ErrorNodes in an AST
 */
export function countErrorNodes(program: Program): number {
  let count = 0;

  function countInArray(items: unknown[]): void {
    for (const item of items) {
      if (item && typeof item === 'object') {
        const node = item as { type?: string };
        if (node.type === 'ErrorNode') {
          count++;
        } else if (node.type === 'CellDefinition') {
          const cell = node as CellDefinition;
          countInArray(cell.components);
          countInArray(cell.gateways);
          countInArray(cell.flows);
          countInArray(cell.nestedCells);
        }
      }
    }
  }

  countInArray(program.statements);

  return count;
}

/**
 * Extract all ErrorNodes from an AST
 */
export function extractErrorNodes(program: Program): ErrorNode[] {
  const errors: ErrorNode[] = [];

  function extractFromArray(items: unknown[]): void {
    for (const item of items) {
      if (item && typeof item === 'object') {
        const node = item as { type?: string };
        if (node.type === 'ErrorNode') {
          errors.push(node as ErrorNode);
        } else if (node.type === 'CellDefinition') {
          const cell = node as CellDefinition;
          extractFromArray(cell.components);
          extractFromArray(cell.gateways);
          extractFromArray(cell.flows);
          extractFromArray(cell.nestedCells);
        }
      }
    }
  }

  extractFromArray(program.statements);

  return errors;
}

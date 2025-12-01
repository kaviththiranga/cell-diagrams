/**
 * CellDL Parser Error Types
 *
 * Comprehensive error classification system for IDE-quality error handling.
 * Provides structured error codes, categories, severity levels, and recovery hints.
 */

// ============================================
// Error Severity & Categories
// ============================================

/** Error severity levels for IDE display */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/** Error category for grouping and filtering */
export type ErrorCategory =
  | 'lexical'     // Tokenization errors (invalid characters, unterminated strings)
  | 'syntactic'   // Grammar rule violations (unexpected tokens, missing elements)
  | 'structural'  // Block/scope issues (unbalanced braces, nesting errors)
  | 'semantic';   // Reference/type errors (undefined references, type mismatches)

// ============================================
// Error Codes
// ============================================

/**
 * Error code ranges:
 * - 1xxx: Lexical errors
 * - 2xxx: Structural errors
 * - 3xxx: Token/terminal errors
 * - 4xxx: Grammar/rule errors
 * - 5xxx: Semantic errors (future)
 */
export const ErrorCode = {
  // Lexical Errors (1xxx)
  UNEXPECTED_CHARACTER: 1001,
  UNTERMINATED_STRING: 1002,
  INVALID_NUMBER: 1003,
  INVALID_ESCAPE_SEQUENCE: 1004,

  // Structural Errors (2xxx)
  MISSING_OPENING_BRACE: 2001,
  MISSING_CLOSING_BRACE: 2002,
  MISSING_OPENING_BRACKET: 2003,
  MISSING_CLOSING_BRACKET: 2004,
  MISSING_OPENING_PAREN: 2005,
  MISSING_CLOSING_PAREN: 2006,
  UNBALANCED_DELIMITERS: 2007,
  UNTERMINATED_BLOCK: 2008,

  // Token/Terminal Errors (3xxx)
  MISSING_IDENTIFIER: 3001,
  MISSING_STRING_LITERAL: 3002,
  MISSING_NUMBER_LITERAL: 3003,
  MISSING_COLON: 3004,
  MISSING_ARROW: 3005,
  MISSING_EQUALS: 3006,
  MISSING_COMMA: 3007,
  MISSING_KEYWORD: 3008,

  // Grammar/Rule Errors (4xxx)
  UNEXPECTED_TOKEN: 4001,
  INVALID_CELL_TYPE: 4002,
  INVALID_COMPONENT_TYPE: 4003,
  INVALID_GATEWAY_DIRECTION: 4004,
  INVALID_EXTERNAL_TYPE: 4005,
  INVALID_USER_TYPE: 4006,
  INVALID_PROTOCOL: 4007,
  INCOMPLETE_CELL_DEFINITION: 4008,
  INCOMPLETE_GATEWAY_DEFINITION: 4009,
  INCOMPLETE_COMPONENT_DEFINITION: 4010,
  INCOMPLETE_FLOW_STATEMENT: 4011,
  NO_VIABLE_ALTERNATIVE: 4012,
  EARLY_EXIT: 4013,
  REDUNDANT_INPUT: 4014,
  INVALID_ATTRIBUTE_VALUE: 4015,

  // Semantic Errors (5xxx) - Reserved for future use
  UNDEFINED_REFERENCE: 5001,
  DUPLICATE_IDENTIFIER: 5002,
  TYPE_MISMATCH: 5003,

  // Unknown/Generic (9xxx)
  UNKNOWN_ERROR: 9999,
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================
// Error Code Metadata
// ============================================

interface ErrorCodeInfo {
  category: ErrorCategory;
  severity: ErrorSeverity;
  name: string;
}

/** Metadata for each error code */
export const ERROR_CODE_INFO: Record<ErrorCodeType, ErrorCodeInfo> = {
  // Lexical
  [ErrorCode.UNEXPECTED_CHARACTER]: { category: 'lexical', severity: 'error', name: 'UnexpectedCharacter' },
  [ErrorCode.UNTERMINATED_STRING]: { category: 'lexical', severity: 'error', name: 'UnterminatedString' },
  [ErrorCode.INVALID_NUMBER]: { category: 'lexical', severity: 'error', name: 'InvalidNumber' },
  [ErrorCode.INVALID_ESCAPE_SEQUENCE]: { category: 'lexical', severity: 'error', name: 'InvalidEscapeSequence' },

  // Structural
  [ErrorCode.MISSING_OPENING_BRACE]: { category: 'structural', severity: 'error', name: 'MissingOpeningBrace' },
  [ErrorCode.MISSING_CLOSING_BRACE]: { category: 'structural', severity: 'error', name: 'MissingClosingBrace' },
  [ErrorCode.MISSING_OPENING_BRACKET]: { category: 'structural', severity: 'error', name: 'MissingOpeningBracket' },
  [ErrorCode.MISSING_CLOSING_BRACKET]: { category: 'structural', severity: 'error', name: 'MissingClosingBracket' },
  [ErrorCode.MISSING_OPENING_PAREN]: { category: 'structural', severity: 'error', name: 'MissingOpeningParen' },
  [ErrorCode.MISSING_CLOSING_PAREN]: { category: 'structural', severity: 'error', name: 'MissingClosingParen' },
  [ErrorCode.UNBALANCED_DELIMITERS]: { category: 'structural', severity: 'error', name: 'UnbalancedDelimiters' },
  [ErrorCode.UNTERMINATED_BLOCK]: { category: 'structural', severity: 'error', name: 'UnterminatedBlock' },

  // Token/Terminal
  [ErrorCode.MISSING_IDENTIFIER]: { category: 'syntactic', severity: 'error', name: 'MissingIdentifier' },
  [ErrorCode.MISSING_STRING_LITERAL]: { category: 'syntactic', severity: 'error', name: 'MissingStringLiteral' },
  [ErrorCode.MISSING_NUMBER_LITERAL]: { category: 'syntactic', severity: 'error', name: 'MissingNumberLiteral' },
  [ErrorCode.MISSING_COLON]: { category: 'syntactic', severity: 'error', name: 'MissingColon' },
  [ErrorCode.MISSING_ARROW]: { category: 'syntactic', severity: 'error', name: 'MissingArrow' },
  [ErrorCode.MISSING_EQUALS]: { category: 'syntactic', severity: 'error', name: 'MissingEquals' },
  [ErrorCode.MISSING_COMMA]: { category: 'syntactic', severity: 'warning', name: 'MissingComma' },
  [ErrorCode.MISSING_KEYWORD]: { category: 'syntactic', severity: 'error', name: 'MissingKeyword' },

  // Grammar/Rule
  [ErrorCode.UNEXPECTED_TOKEN]: { category: 'syntactic', severity: 'error', name: 'UnexpectedToken' },
  [ErrorCode.INVALID_CELL_TYPE]: { category: 'syntactic', severity: 'error', name: 'InvalidCellType' },
  [ErrorCode.INVALID_COMPONENT_TYPE]: { category: 'syntactic', severity: 'error', name: 'InvalidComponentType' },
  [ErrorCode.INVALID_GATEWAY_DIRECTION]: { category: 'syntactic', severity: 'error', name: 'InvalidGatewayDirection' },
  [ErrorCode.INVALID_EXTERNAL_TYPE]: { category: 'syntactic', severity: 'error', name: 'InvalidExternalType' },
  [ErrorCode.INVALID_USER_TYPE]: { category: 'syntactic', severity: 'error', name: 'InvalidUserType' },
  [ErrorCode.INVALID_PROTOCOL]: { category: 'syntactic', severity: 'error', name: 'InvalidProtocol' },
  [ErrorCode.INCOMPLETE_CELL_DEFINITION]: { category: 'syntactic', severity: 'error', name: 'IncompleteCellDefinition' },
  [ErrorCode.INCOMPLETE_GATEWAY_DEFINITION]: { category: 'syntactic', severity: 'error', name: 'IncompleteGatewayDefinition' },
  [ErrorCode.INCOMPLETE_COMPONENT_DEFINITION]: { category: 'syntactic', severity: 'error', name: 'IncompleteComponentDefinition' },
  [ErrorCode.INCOMPLETE_FLOW_STATEMENT]: { category: 'syntactic', severity: 'error', name: 'IncompleteFlowStatement' },
  [ErrorCode.NO_VIABLE_ALTERNATIVE]: { category: 'syntactic', severity: 'error', name: 'NoViableAlternative' },
  [ErrorCode.EARLY_EXIT]: { category: 'syntactic', severity: 'error', name: 'EarlyExit' },
  [ErrorCode.REDUNDANT_INPUT]: { category: 'syntactic', severity: 'warning', name: 'RedundantInput' },
  [ErrorCode.INVALID_ATTRIBUTE_VALUE]: { category: 'syntactic', severity: 'error', name: 'InvalidAttributeValue' },

  // Semantic
  [ErrorCode.UNDEFINED_REFERENCE]: { category: 'semantic', severity: 'error', name: 'UndefinedReference' },
  [ErrorCode.DUPLICATE_IDENTIFIER]: { category: 'semantic', severity: 'warning', name: 'DuplicateIdentifier' },
  [ErrorCode.TYPE_MISMATCH]: { category: 'semantic', severity: 'error', name: 'TypeMismatch' },

  // Unknown
  [ErrorCode.UNKNOWN_ERROR]: { category: 'syntactic', severity: 'error', name: 'UnknownError' },
};

// ============================================
// Suggested Fix Interface
// ============================================

/** A suggested fix that can be applied automatically */
export interface SuggestedFix {
  /** Human-readable description of the fix */
  description: string;
  /** The text to insert/replace */
  replacement: string;
  /** Range to replace (if startOffset === endOffset, it's an insertion) */
  range: {
    startOffset: number;
    endOffset: number;
  };
}

// ============================================
// Enhanced Parse Error Interface
// ============================================

/** Enhanced parse error with full context for IDE integration */
export interface EnhancedParseError {
  /** Unique error code for programmatic handling */
  code: ErrorCodeType;
  /** Error category for grouping/filtering */
  category: ErrorCategory;
  /** Severity level for display priority */
  severity: ErrorSeverity;
  /** Human-readable error message */
  message: string;

  // Location information (1-based lines/columns)
  /** Start line (1-based) */
  line: number;
  /** Start column (1-based) */
  column: number;
  /** End line (1-based) */
  endLine: number;
  /** End column (1-based) */
  endColumn: number;
  /** Start offset (0-based) */
  offset: number;
  /** Length of the error span */
  length: number;

  // Recovery support
  /** Human-readable hint for fixing the error */
  recoveryHint?: string;
  /** Suggested automatic fix */
  suggestedFix?: SuggestedFix;

  // Context for IDE features
  /** Grammar rule where error occurred */
  ruleName?: string;
  /** Token types that were expected */
  expectedTokens?: string[];
  /** The actual token that was found */
  actualToken?: string;
  /** Previous tokens for context */
  previousTokens?: string[];
}

// ============================================
// Enhanced Parse Result Interface
// ============================================

import type { Program } from '../ast/types';

/** Result of parsing with error recovery */
export interface EnhancedParseResult {
  /** The parsed AST (always provided, may contain ErrorNodes) */
  ast: Program;
  /** All errors collected during parsing */
  errors: EnhancedParseError[];
  /** True if no errors were encountered */
  success: boolean;
  /** True if AST is complete (no ErrorNodes) */
  isComplete: boolean;
  /** References to ErrorNodes within the AST for easy access */
  errorNodeCount: number;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get the category for an error code
 */
export function getErrorCategory(code: ErrorCodeType): ErrorCategory {
  return ERROR_CODE_INFO[code]?.category ?? 'syntactic';
}

/**
 * Get the severity for an error code
 */
export function getErrorSeverity(code: ErrorCodeType): ErrorSeverity {
  return ERROR_CODE_INFO[code]?.severity ?? 'error';
}

/**
 * Get the human-readable name for an error code
 */
export function getErrorName(code: ErrorCodeType): string {
  return ERROR_CODE_INFO[code]?.name ?? 'UnknownError';
}

/**
 * Create an enhanced parse error with defaults
 */
export function createEnhancedError(
  code: ErrorCodeType,
  message: string,
  location: {
    line: number;
    column: number;
    endLine?: number | undefined;
    endColumn?: number | undefined;
    offset: number;
    length: number;
  },
  options?: {
    recoveryHint?: string | undefined;
    suggestedFix?: SuggestedFix | undefined;
    ruleName?: string | undefined;
    expectedTokens?: string[] | undefined;
    actualToken?: string | undefined;
    previousTokens?: string[] | undefined;
  }
): EnhancedParseError {
  const info = ERROR_CODE_INFO[code] ?? ERROR_CODE_INFO[ErrorCode.UNKNOWN_ERROR];

  const result: EnhancedParseError = {
    code,
    category: info.category,
    severity: info.severity,
    message,
    line: location.line,
    column: location.column,
    endLine: location.endLine ?? location.line,
    endColumn: location.endColumn ?? location.column + location.length,
    offset: location.offset,
    length: location.length,
  };

  // Only add optional properties if they have values
  if (options?.recoveryHint) result.recoveryHint = options.recoveryHint;
  if (options?.suggestedFix) result.suggestedFix = options.suggestedFix;
  if (options?.ruleName) result.ruleName = options.ruleName;
  if (options?.expectedTokens) result.expectedTokens = options.expectedTokens;
  if (options?.actualToken) result.actualToken = options.actualToken;
  if (options?.previousTokens) result.previousTokens = options.previousTokens;

  return result;
}

/**
 * @cell-diagrams/core
 *
 * Parser and AST for Cell Diagrams DSL.
 */

// AST Types
export * from './ast/types';

// Parser (standard)
export { parse, parseOrThrow, validate } from './parser';
export type { ParseResult, ParseError } from './parser';

// Parser (with error recovery for IDEs)
export { parseWithRecovery, validateWithRecovery } from './parser';
export type { EnhancedParseError, EnhancedParseResult } from './parser';

// Error handling system
export {
  ErrorCode,
  ErrorCollector,
  createErrorCollector,
  getTokenDisplayName,
  formatExpectedTokens,
  findClosestMatch,
  countErrorNodes,
  extractErrorNodes,
} from './errors';
export type {
  ErrorCodeType,
  ErrorSeverity,
  ErrorCategory,
  SuggestedFix,
} from './errors';

// Stringify
export { stringify } from './stringify';
export type { StringifyOptions } from './stringify';

// Lexer (for editor integrations)
export {
  CellDiagramsLexer,
  tokenize,
  allTokens,
  keywordTokens,
  componentTypeTokens,
  cellTypeTokens,
  endpointTypeTokens,
} from './grammar/lexer';

// Parser (for advanced usage)
export {
  parserInstance,
  CellDiagramsParser,
  getBaseCstVisitorConstructor,
} from './grammar/parser';

// Version
export const VERSION = '0.1.0';

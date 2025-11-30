/**
 * @cell-diagrams/core
 *
 * Parser and AST for Cell Diagrams DSL.
 */

// AST Types
export * from './ast/types';

// Parser
export { parse, parseOrThrow, validate } from './parser';
export type { ParseResult, ParseError } from './parser';

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

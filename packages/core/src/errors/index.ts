/**
 * CellDL Error Handling Module
 *
 * Comprehensive error handling for IDE-quality parsing with:
 * - Structured error codes and categories
 * - Custom, human-readable error messages
 * - Recovery hints and suggested fixes
 * - Error aggregation and deduplication
 * - Partial AST generation with ErrorNodes
 */

// Types and error codes
export {
  ErrorCode,
  ERROR_CODE_INFO,
  getErrorCategory,
  getErrorSeverity,
  getErrorName,
  createEnhancedError,
} from './types';
export type {
  ErrorCodeType,
  ErrorSeverity,
  ErrorCategory,
  EnhancedParseError,
  EnhancedParseResult,
  SuggestedFix,
} from './types';

// Custom error messages
export {
  TOKEN_DISPLAY_NAMES,
  getTokenDisplayName,
  formatExpectedTokens,
  customErrorMessageProvider,
  convertRecognitionException,
  convertLexerError,
  buildMissingTokenMessage,
  buildNoViableAltMessage,
  buildEarlyExitMessage,
  buildRedundantInputMessage,
  VALID_CELL_TYPES,
  VALID_COMPONENT_TYPES,
  VALID_EXTERNAL_TYPES,
  VALID_USER_TYPES,
  VALID_PROTOCOLS,
} from './messages';

// Recovery hints and pattern detection
export {
  errorPatterns,
  detectErrorPatterns,
  getRecoveryHint,
  getSuggestedFix,
  findClosestMatch,
} from './recovery';
export type { ErrorPattern, PatternContext } from './recovery';

// Error collection
export {
  ErrorCollector,
  createErrorCollector,
  collectAllErrors,
} from './collector';

// Error-tolerant visitor
export {
  visitProgramWithRecovery,
  visitStatementsWithRecovery,
  safeVisit,
  safeVisitMany,
  countErrorNodes,
  extractErrorNodes,
  resetVisitorErrors,
  getVisitorErrors,
} from './tolerant-visitor';

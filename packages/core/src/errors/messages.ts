/**
 * CellDL Parser Error Messages
 *
 * Human-readable error messages with context-aware templates.
 * Maps internal token names to display names and provides message builders.
 */

import type { IToken, IRecognitionException, TokenType } from 'chevrotain';
import {
  ErrorCode,
  ErrorCodeType,
  EnhancedParseError,
  createEnhancedError,
} from './types';

// ============================================
// Token Display Names
// ============================================

/** Map internal token names to human-readable display names */
export const TOKEN_DISPLAY_NAMES: Record<string, string> = {
  // Delimiters
  LBrace: "'{'",
  RBrace: "'}'",
  LBracket: "'['",
  RBracket: "']'",
  LParen: "'('",
  RParen: "')'",
  Colon: "':'",
  Comma: "','",
  Dot: "'.'",
  Arrow: "'->'",
  Equals: "'='",

  // Literals
  StringLiteral: 'a string (e.g., "example")',
  NumberLiteral: 'a number (e.g., 8080)',
  Identifier: 'an identifier',

  // Top-level keywords
  Workspace: "'workspace' keyword",
  Diagram: "'diagram' keyword",
  Cell: "'cell' keyword",
  External: "'external' keyword",
  User: "'user' keyword",
  Application: "'application' keyword",
  Flow: "'flow' keyword",
  Connections: "'connections' keyword",

  // Cell/Gateway keywords
  Label: "'label'",
  Type: "'type'",
  Gateway: "'gateway' keyword",
  Ingress: "'ingress' keyword",
  Egress: "'egress' keyword",
  Components: "'components' block",
  Component: "'component' keyword",
  Cluster: "'cluster' keyword",
  Exposes: "'exposes'",
  Policies: "'policies'",
  Auth: "'auth'",
  Federated: "'federated'",
  LocalSts: "'local-sts'",
  Routes: "'routes' block",
  Route: "'route' keyword",
  Context: "'context'",
  Description: "'description'",
  Property: "'property'",

  // Cell types
  Logic: "'logic'",
  Integration: "'integration'",
  Data: "'data'",
  Security: "'security'",
  Channel: "'channel'",
  LegacyType: "'legacy'",

  // Component types
  Microservice: "'microservice'",
  Function: "'function'",
  Database: "'database'",
  Broker: "'broker'",
  Cache: "'cache'",
  Idp: "'idp'",
  Sts: "'sts'",
  Userstore: "'userstore'",
  Esb: "'esb'",
  Adapter: "'adapter'",
  Transformer: "'transformer'",
  Webapp: "'webapp'",
  Mobile: "'mobile'",
  Iot: "'iot'",
  Ms: "'ms'",
  Fn: "'fn'",
  Db: "'db'",

  // Properties
  Source: "'source'",
  Port: "'port'",
  Env: "'env'",
  Engine: "'engine'",
  Storage: "'storage'",
  Target: "'target'",
  Policy: "'policy'",
  Protocol: "'protocol'",
  Tech: "'tech'",
  Replicas: "'replicas'",
  Version: "'version'",

  // Protocols
  Https: "'https'",
  Http: "'http'",
  Grpc: "'grpc'",
  Tcp: "'tcp'",
  Mtls: "'mtls'",
  Kafka: "'kafka'",

  // External types
  Saas: "'saas'",
  Partner: "'partner'",
  Enterprise: "'enterprise'",

  // User types
  Internal: "'internal'",
  System: "'system'",

  // Booleans
  True: "'true'",
  False: "'false'",
};

/**
 * Get display name for a token type
 */
export function getTokenDisplayName(tokenType: TokenType | string): string {
  const name = typeof tokenType === 'string' ? tokenType : tokenType.name;
  return TOKEN_DISPLAY_NAMES[name] ?? `'${name}'`;
}

/**
 * Format a list of expected tokens for display
 */
export function formatExpectedTokens(tokenTypes: TokenType[]): string {
  const names = tokenTypes.map(getTokenDisplayName);

  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} or ${names[1]}`;

  const last = names.pop();
  return `${names.join(', ')}, or ${last}`;
}

// ============================================
// Valid Values for Error Messages
// ============================================

export const VALID_CELL_TYPES = ['logic', 'integration', 'data', 'security', 'channel', 'legacy'];
export const VALID_COMPONENT_TYPES = [
  'microservice', 'ms', 'function', 'fn', 'database', 'db',
  'broker', 'cache', 'gateway', 'idp', 'sts', 'userstore',
  'esb', 'adapter', 'transformer', 'webapp', 'mobile', 'iot', 'legacy',
];
export const VALID_EXTERNAL_TYPES = ['saas', 'partner', 'enterprise'];
export const VALID_USER_TYPES = ['external', 'internal', 'system'];
export const VALID_PROTOCOLS = ['https', 'http', 'grpc', 'tcp', 'mtls', 'kafka'];

// ============================================
// Context-Aware Message Templates
// ============================================

interface MessageContext {
  ruleName?: string | undefined;
  expectedTokens?: TokenType[] | undefined;
  actualToken?: IToken | undefined;
  previousToken?: IToken | undefined;
  blockType?: string | undefined;
  blockStartLine?: number | undefined;
}

/**
 * Build error message for missing token
 */
export function buildMissingTokenMessage(
  expected: TokenType,
  context: MessageContext
): { message: string; hint: string | undefined; code: ErrorCodeType } {
  const expectedName = getTokenDisplayName(expected);
  const actual = context.actualToken
    ? context.actualToken.image
    : 'end of input';

  // Specific messages for common missing tokens
  switch (expected.name) {
    case 'LBrace':
      return {
        message: `Expected ${expectedName} to start a block, but found '${actual}'`,
        hint: `Add '{' to begin the ${context.blockType ? context.blockType : 'block'} definition`,
        code: ErrorCode.MISSING_OPENING_BRACE,
      };

    case 'RBrace':
      if (context.blockStartLine) {
        return {
          message: `Missing closing '}' for block started at line ${context.blockStartLine}`,
          hint: "Add '}' to close the block",
          code: ErrorCode.MISSING_CLOSING_BRACE,
        };
      }
      return {
        message: `Expected ${expectedName} to close the block, but found '${actual}'`,
        hint: "Check for missing '}' or extra content in the block",
        code: ErrorCode.MISSING_CLOSING_BRACE,
      };

    case 'Colon':
      return {
        message: `Expected ':' after property name, but found '${actual}'`,
        hint: "Add ':' between the property name and value",
        code: ErrorCode.MISSING_COLON,
      };

    case 'Arrow':
      return {
        message: `Expected '->' between flow source and target, but found '${actual}'`,
        hint: 'Use "->" to connect flow endpoints. Example: source -> destination',
        code: ErrorCode.MISSING_ARROW,
      };

    case 'StringLiteral':
      return {
        message: `Expected a quoted string, but found '${actual}'`,
        hint: 'Wrap the value in double quotes. Example: "MyValue"',
        code: ErrorCode.MISSING_STRING_LITERAL,
      };

    case 'Identifier':
      return {
        message: `Expected an identifier (name), but found '${actual}'`,
        hint: 'Provide a valid name starting with a letter or underscore',
        code: ErrorCode.MISSING_IDENTIFIER,
      };

    case 'NumberLiteral':
      return {
        message: `Expected a number, but found '${actual}'`,
        hint: 'Provide a numeric value. Example: 8080',
        code: ErrorCode.MISSING_NUMBER_LITERAL,
      };

    default:
      return {
        message: `Expected ${expectedName}, but found '${actual}'`,
        hint: undefined,
        code: ErrorCode.MISSING_KEYWORD,
      };
  }
}

/**
 * Build error message for no viable alternative
 */
export function buildNoViableAltMessage(
  context: MessageContext
): { message: string; hint: string | undefined; code: ErrorCodeType } {
  const actual = context.actualToken?.image ?? 'end of input';
  const expected = context.expectedTokens
    ? formatExpectedTokens(context.expectedTokens)
    : 'valid syntax';

  // Context-specific messages based on rule name
  switch (context.ruleName) {
    case 'cellType':
      return {
        message: `'${actual}' is not a valid cell type`,
        hint: `Valid cell types are: ${VALID_CELL_TYPES.join(', ')}`,
        code: ErrorCode.INVALID_CELL_TYPE,
      };

    case 'componentType':
      return {
        message: `'${actual}' is not a valid component type`,
        hint: `Valid component types are: ${VALID_COMPONENT_TYPES.join(', ')}`,
        code: ErrorCode.INVALID_COMPONENT_TYPE,
      };

    case 'externalType':
      return {
        message: `'${actual}' is not a valid external system type`,
        hint: `Valid types are: ${VALID_EXTERNAL_TYPES.join(', ')}`,
        code: ErrorCode.INVALID_EXTERNAL_TYPE,
      };

    case 'userType':
      return {
        message: `'${actual}' is not a valid user type`,
        hint: `Valid types are: ${VALID_USER_TYPES.join(', ')}`,
        code: ErrorCode.INVALID_USER_TYPE,
      };

    case 'protocol':
      return {
        message: `'${actual}' is not a valid protocol`,
        hint: `Valid protocols are: ${VALID_PROTOCOLS.join(', ')}`,
        code: ErrorCode.INVALID_PROTOCOL,
      };

    case 'gatewayDirection':
      return {
        message: `'${actual}' is not a valid gateway direction`,
        hint: "Use 'ingress' for incoming traffic or 'egress' for outgoing traffic",
        code: ErrorCode.INVALID_GATEWAY_DIRECTION,
      };

    case 'cellDefinition':
      return {
        message: `Unexpected '${actual}' in cell definition`,
        hint: 'A cell definition needs: cell "Name" type:cellType { ... }',
        code: ErrorCode.INCOMPLETE_CELL_DEFINITION,
      };

    case 'gatewayDefinition':
    case 'gatewayBlock':
      return {
        message: `Unexpected '${actual}' in gateway definition`,
        hint: 'A gateway definition needs: gateway { protocol https port 443 }',
        code: ErrorCode.INCOMPLETE_GATEWAY_DEFINITION,
      };

    case 'componentDefinition':
      return {
        message: `Unexpected '${actual}' in component definition`,
        hint: 'Component format: componentType ComponentName { properties }',
        code: ErrorCode.INCOMPLETE_COMPONENT_DEFINITION,
      };

    case 'flowStatement':
      return {
        message: `Unexpected '${actual}' in flow statement`,
        hint: 'Flow format: source -> destination',
        code: ErrorCode.INCOMPLETE_FLOW_STATEMENT,
      };

    default:
      return {
        message: `Unexpected '${actual}'. Expected ${expected}`,
        hint: undefined,
        code: ErrorCode.NO_VIABLE_ALTERNATIVE,
      };
  }
}

/**
 * Build error message for early exit (AT_LEAST_ONE/MANY failed)
 */
export function buildEarlyExitMessage(
  context: MessageContext
): { message: string; hint: string | undefined; code: ErrorCodeType } {
  const actual = context.actualToken?.image ?? 'end of input';

  switch (context.ruleName) {
    case 'components':
    case 'componentsBlock':
      return {
        message: `Expected at least one component, but found '${actual}'`,
        hint: 'Add at least one component inside the components block',
        code: ErrorCode.EARLY_EXIT,
      };

    case 'flows':
    case 'flowBlock':
      return {
        message: `Expected at least one flow statement, but found '${actual}'`,
        hint: 'Add at least one flow: source -> destination',
        code: ErrorCode.EARLY_EXIT,
      };

    case 'routes':
    case 'routesBlock':
      return {
        message: `Expected at least one route, but found '${actual}'`,
        hint: 'Add at least one route: "/path" -> target',
        code: ErrorCode.EARLY_EXIT,
      };

    default:
      return {
        message: `Expected more content, but found '${actual}'`,
        hint: undefined,
        code: ErrorCode.EARLY_EXIT,
      };
  }
}

/**
 * Build error message for redundant input (tokens after valid parse)
 */
export function buildRedundantInputMessage(
  firstRedundant: IToken
): { message: string; hint: string | undefined; code: ErrorCodeType } {
  return {
    message: `Unexpected '${firstRedundant.image}' after end of valid input`,
    hint: 'Remove the extra content or check for missing block delimiters',
    code: ErrorCode.REDUNDANT_INPUT,
  };
}

// ============================================
// Chevrotain Error Message Provider
// ============================================

/**
 * Custom error message provider for Chevrotain parser.
 * Implements IParserErrorMessageProvider interface.
 */
export const customErrorMessageProvider = {
  /**
   * Called when a token mismatch is detected
   */
  buildMismatchTokenMessage(options: {
    expected: TokenType;
    actual: IToken;
    previous: IToken;
    ruleName: string;
  }): string {
    const { message } = buildMissingTokenMessage(options.expected, {
      ruleName: options.ruleName,
      actualToken: options.actual,
      previousToken: options.previous,
    });
    return message;
  },

  /**
   * Called when none of the alternatives in an OR could be matched
   */
  buildNoViableAltMessage(options: {
    expectedPathsPerAlt: TokenType[][][];
    actual: IToken[];
    previous: IToken;
    customUserDescription?: string;
    ruleName: string;
  }): string {
    // Flatten expected tokens from all alternatives (three levels deep)
    const allExpected = options.expectedPathsPerAlt.flat(2);
    const uniqueExpected = [...new Set(allExpected.map((t) => t.name))]
      .map((name) => allExpected.find((t) => t.name === name)!)
      .filter(Boolean);

    const { message } = buildNoViableAltMessage({
      ruleName: options.ruleName,
      expectedTokens: uniqueExpected,
      actualToken: options.actual[0],
      previousToken: options.previous,
    });
    return message;
  },

  /**
   * Called when AT_LEAST_ONE or MANY fails on first iteration
   */
  buildEarlyExitMessage(options: {
    expectedIterationPaths: TokenType[][];
    actual: IToken[];
    previous: IToken;
    customUserDescription: string;
    ruleName: string;
  }): string {
    const { message } = buildEarlyExitMessage({
      ruleName: options.ruleName,
      actualToken: options.actual[0],
      previousToken: options.previous,
    });
    return message;
  },

  /**
   * Called when there's unparsed input after a valid parse
   */
  buildNotAllInputParsedMessage(options: {
    firstRedundant: IToken;
    ruleName: string;
  }): string {
    const { message } = buildRedundantInputMessage(options.firstRedundant);
    return message;
  },
};

// ============================================
// Error Conversion Utilities
// ============================================

/**
 * Convert a Chevrotain recognition exception to an enhanced error
 */
export function convertRecognitionException(
  exception: IRecognitionException,
  tokens: IToken[]
): EnhancedParseError {
  const token = exception.token;
  const line = token.startLine ?? 1;
  const column = token.startColumn ?? 1;
  const offset = token.startOffset;
  const length = token.image?.length ?? 1;
  const endLine = token.endLine ?? line;
  const endColumn = token.endColumn ?? column + length;

  // Determine error code based on exception type
  let code: ErrorCodeType = ErrorCode.UNKNOWN_ERROR;
  let hint: string | undefined;

  const exceptionName = exception.name;
  const ruleName = exception.context?.ruleStack?.[exception.context.ruleStack.length - 1];

  if (exceptionName === 'MismatchedTokenException') {
    const result = buildMissingTokenMessage(
      (exception as { expectedToken?: TokenType }).expectedToken ?? { name: 'unknown' } as TokenType,
      { ruleName, actualToken: token }
    );
    code = result.code;
    hint = result.hint;
  } else if (exceptionName === 'NoViableAltException') {
    const result = buildNoViableAltMessage({ ruleName, actualToken: token });
    code = result.code;
    hint = result.hint;
  } else if (exceptionName === 'EarlyExitException') {
    const result = buildEarlyExitMessage({ ruleName, actualToken: token });
    code = result.code;
    hint = result.hint;
  } else if (exceptionName === 'NotAllInputParsedException') {
    const result = buildRedundantInputMessage(token);
    code = result.code;
    hint = result.hint;
  }

  // Get surrounding tokens for context
  const tokenIndex = tokens.findIndex((t) => t.startOffset === token.startOffset);
  const previousTokens = tokenIndex > 0
    ? tokens.slice(Math.max(0, tokenIndex - 3), tokenIndex).map((t) => t.image)
    : [];

  return createEnhancedError(
    code,
    exception.message,
    { line, column, endLine, endColumn, offset, length },
    {
      recoveryHint: hint,
      ruleName,
      actualToken: token.image,
      previousTokens,
    }
  );
}

/**
 * Convert a Chevrotain lexer error to an enhanced error
 */
export function convertLexerError(
  error: { message: string; line?: number; column?: number; offset: number; length: number }
): EnhancedParseError {
  const line = error.line ?? 1;
  const column = error.column ?? 1;

  // Determine error code based on message
  let code: ErrorCodeType = ErrorCode.UNEXPECTED_CHARACTER;
  let hint: string | undefined;

  if (error.message.includes('unterminated') || error.message.includes('Unterminated')) {
    code = ErrorCode.UNTERMINATED_STRING;
    hint = 'Make sure to close the string with a matching quote';
  }

  return createEnhancedError(
    code,
    error.message,
    {
      line,
      column,
      offset: error.offset,
      length: error.length,
    },
    { recoveryHint: hint }
  );
}

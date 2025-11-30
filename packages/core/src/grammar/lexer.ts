/**
 * Cell Diagrams Lexer
 *
 * Tokenizes Cell Diagrams DSL source code using Chevrotain.
 * Exports individual tokens for use in syntax highlighting.
 */

import { createToken, Lexer, TokenType } from 'chevrotain';

// ============================================
// Whitespace & Comments (Skipped)
// ============================================

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const LineComment = createToken({
  name: 'LineComment',
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const BlockComment = createToken({
  name: 'BlockComment',
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED,
});

// ============================================
// Operators & Delimiters
// ============================================

export const Arrow = createToken({ name: 'Arrow', pattern: /->/ });
export const LBrace = createToken({ name: 'LBrace', pattern: /\{/ });
export const RBrace = createToken({ name: 'RBrace', pattern: /\}/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });

// ============================================
// Keywords
// ============================================

export const Cell = createToken({ name: 'Cell', pattern: /cell/ });
export const External = createToken({ name: 'External', pattern: /external/ });
export const User = createToken({ name: 'User', pattern: /user/ });
export const Connect = createToken({ name: 'Connect', pattern: /connect/ });
export const Components = createToken({ name: 'Components', pattern: /components/ });
export const Expose = createToken({ name: 'Expose', pattern: /expose/ });
export const Name = createToken({ name: 'Name', pattern: /name/ });
export const Type = createToken({ name: 'Type', pattern: /type/ });
export const Via = createToken({ name: 'Via', pattern: /via/ });
export const Label = createToken({ name: 'Label', pattern: /label/ });

// ============================================
// Component Type Keywords
// ============================================

export const Ms = createToken({ name: 'Ms', pattern: /ms/ });
export const Fn = createToken({ name: 'Fn', pattern: /fn/ });
export const Db = createToken({ name: 'Db', pattern: /db/ });
export const Gw = createToken({ name: 'Gw', pattern: /gw/ });
export const Svc = createToken({ name: 'Svc', pattern: /svc/ });
export const Broker = createToken({ name: 'Broker', pattern: /broker/ });
export const Cache = createToken({ name: 'Cache', pattern: /cache/ });
export const Legacy = createToken({ name: 'Legacy', pattern: /legacy/ });
export const Esb = createToken({ name: 'Esb', pattern: /esb/ });
export const Idp = createToken({ name: 'Idp', pattern: /idp/ });

// ============================================
// Endpoint Type Keywords
// ============================================

export const Api = createToken({ name: 'Api', pattern: /api/ });
export const Event = createToken({ name: 'Event', pattern: /event/ });
export const Stream = createToken({ name: 'Stream', pattern: /stream/ });

// ============================================
// Cell Type Keywords
// ============================================

export const Logic = createToken({ name: 'Logic', pattern: /logic/ });
export const Integration = createToken({ name: 'Integration', pattern: /integration/ });
export const Data = createToken({ name: 'Data', pattern: /data/ });
export const Security = createToken({ name: 'Security', pattern: /security/ });
export const Channel = createToken({ name: 'Channel', pattern: /channel/ });

// ============================================
// Literals
// ============================================

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"/,
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?\d+(\.\d+)?/,
});

export const True = createToken({ name: 'True', pattern: /true/ });
export const False = createToken({ name: 'False', pattern: /false/ });

// ============================================
// Identifier (must come AFTER all keywords)
// ============================================

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

// ============================================
// Token Arrays for Organization
// ============================================

/** All component type tokens */
export const componentTypeTokens: TokenType[] = [
  Ms, Fn, Db, Gw, Svc, Broker, Cache, Legacy, Esb, Idp,
];

/** All cell type tokens */
export const cellTypeTokens: TokenType[] = [
  Logic, Integration, Legacy, Data, Security, Channel, External,
];

/** All endpoint type tokens */
export const endpointTypeTokens: TokenType[] = [Api, Event, Stream];

/** All keyword tokens */
export const keywordTokens: TokenType[] = [
  Cell, External, User, Connect, Components, Expose,
  Name, Type, Via, Label,
  ...componentTypeTokens,
  ...endpointTypeTokens,
  Logic, Integration, Data, Security, Channel,
  True, False,
];

// ============================================
// Complete Token List (Order Matters!)
// ============================================

/**
 * All tokens in lexer priority order.
 * Keywords must come before Identifier.
 */
export const allTokens: TokenType[] = [
  // Whitespace and comments (highest priority - skipped)
  WhiteSpace,
  LineComment,
  BlockComment,

  // Multi-character operators (before single-char)
  Arrow,

  // Keywords (before Identifier)
  Cell,
  External,
  User,
  Connect,
  Components,
  Expose,
  Name,
  Type,
  Via,
  Label,

  // Component types
  Ms,
  Fn,
  Db,
  Gw,
  Svc,
  Broker,
  Cache,
  Legacy,
  Esb,
  Idp,

  // Endpoint types
  Api,
  Event,
  Stream,

  // Cell types
  Logic,
  Integration,
  Data,
  Security,
  Channel,

  // Boolean literals
  True,
  False,

  // Other literals
  StringLiteral,
  NumberLiteral,

  // Identifier (after all keywords)
  Identifier,

  // Single-character delimiters
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Colon,
  Comma,
];

// ============================================
// Lexer Instance
// ============================================

/**
 * The Cell Diagrams lexer instance.
 * Use CellDiagramsLexer.tokenize(source) to tokenize source code.
 */
export const CellDiagramsLexer = new Lexer(allTokens, {
  ensureOptimizations: true,
  positionTracking: 'full',
});

// ============================================
// Lexer Utilities
// ============================================

export interface LexResult {
  tokens: ReturnType<typeof CellDiagramsLexer.tokenize>['tokens'];
  errors: ReturnType<typeof CellDiagramsLexer.tokenize>['errors'];
}

/**
 * Tokenize source code.
 */
export function tokenize(source: string): LexResult {
  const result = CellDiagramsLexer.tokenize(source);
  return {
    tokens: result.tokens,
    errors: result.errors,
  };
}

/**
 * Cell Diagrams Lexer
 *
 * Tokenizes Cell Diagrams DSL source code using Chevrotain.
 * Complete rewrite for Cell-Based Architecture DSL.
 *
 * IMPORTANT: Uses longer_alt to handle tokens that are prefixes of other tokens.
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
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const LBrace = createToken({ name: 'LBrace', pattern: /\{/ });
export const RBrace = createToken({ name: 'RBrace', pattern: /\}/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });

// ============================================
// Identifier (defined first for longer_alt references)
// ============================================

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

// ============================================
// Keywords that have longer versions (must define longer ones first)
// ============================================

// "cells" is longer than "cell"
export const Cells = createToken({
  name: 'Cells',
  pattern: /cells/,
  longer_alt: Identifier
});
export const Cell = createToken({
  name: 'Cell',
  pattern: /cell/,
  longer_alt: Cells
});

// "userstore" is longer than "user"
export const Userstore = createToken({
  name: 'Userstore',
  pattern: /userstore/,
  longer_alt: Identifier
});
export const User = createToken({
  name: 'User',
  pattern: /user/,
  longer_alt: Userstore
});

// "channels" is longer than "channel"
export const Channels = createToken({
  name: 'Channels',
  pattern: /channels/,
  longer_alt: Identifier
});
export const Channel = createToken({
  name: 'Channel',
  pattern: /channel/,
  longer_alt: Channels
});

// "database" is longer than "data"
export const Database = createToken({
  name: 'Database',
  pattern: /database/,
  longer_alt: Identifier
});
export const Data = createToken({
  name: 'Data',
  pattern: /data/,
  longer_alt: Database
});

// ============================================
// Top-Level Keywords
// ============================================

export const Diagram = createToken({ name: 'Diagram', pattern: /diagram/, longer_alt: Identifier });
export const External = createToken({ name: 'External', pattern: /external/, longer_alt: Identifier });
export const Application = createToken({ name: 'Application', pattern: /application/, longer_alt: Identifier });
export const Connections = createToken({ name: 'Connections', pattern: /connections/, longer_alt: Identifier });

// ============================================
// Cell & Gateway Keywords
// ============================================

export const Label = createToken({ name: 'Label', pattern: /label/, longer_alt: Identifier });
export const Type = createToken({ name: 'Type', pattern: /type/, longer_alt: Identifier });
export const Gateway = createToken({ name: 'Gateway', pattern: /gateway/, longer_alt: Identifier });
export const Components = createToken({ name: 'Components', pattern: /components/, longer_alt: Identifier });
export const Cluster = createToken({ name: 'Cluster', pattern: /cluster/, longer_alt: Identifier });
export const Exposes = createToken({ name: 'Exposes', pattern: /exposes/, longer_alt: Identifier });
export const Policies = createToken({ name: 'Policies', pattern: /policies/, longer_alt: Identifier });
export const Auth = createToken({ name: 'Auth', pattern: /auth/, longer_alt: Identifier });
export const Federated = createToken({ name: 'Federated', pattern: /federated/, longer_alt: Identifier });
export const LocalSts = createToken({ name: 'LocalSts', pattern: /local-sts/ });

// ============================================
// Cell Types
// ============================================

export const Logic = createToken({ name: 'Logic', pattern: /logic/, longer_alt: Identifier });
export const Integration = createToken({ name: 'Integration', pattern: /integration/, longer_alt: Identifier });
export const Security = createToken({ name: 'Security', pattern: /security/, longer_alt: Identifier });
export const LegacyType = createToken({ name: 'LegacyType', pattern: /legacy/, longer_alt: Identifier });

// ============================================
// Component Types (Full Names)
// ============================================

export const Microservice = createToken({ name: 'Microservice', pattern: /microservice/, longer_alt: Identifier });
export const Function = createToken({ name: 'Function', pattern: /function/, longer_alt: Identifier });
export const Broker = createToken({ name: 'Broker', pattern: /broker/, longer_alt: Identifier });
export const Cache = createToken({ name: 'Cache', pattern: /cache/, longer_alt: Identifier });

// Security Component Types
export const Idp = createToken({ name: 'Idp', pattern: /idp/, longer_alt: Identifier });
export const Sts = createToken({ name: 'Sts', pattern: /sts/, longer_alt: Identifier });

// Integration Component Types
export const Esb = createToken({ name: 'Esb', pattern: /esb/, longer_alt: Identifier });
export const Adapter = createToken({ name: 'Adapter', pattern: /adapter/, longer_alt: Identifier });
export const Transformer = createToken({ name: 'Transformer', pattern: /transformer/, longer_alt: Identifier });

// Frontend Component Types
export const Webapp = createToken({ name: 'Webapp', pattern: /webapp/, longer_alt: Identifier });
export const Mobile = createToken({ name: 'Mobile', pattern: /mobile/, longer_alt: Identifier });
export const Iot = createToken({ name: 'Iot', pattern: /iot/, longer_alt: Identifier });

// Component Type Aliases (Short Forms)
export const Ms = createToken({ name: 'Ms', pattern: /ms/, longer_alt: Identifier });
export const Fn = createToken({ name: 'Fn', pattern: /fn/, longer_alt: Identifier });
export const Db = createToken({ name: 'Db', pattern: /db/, longer_alt: Identifier });

// ============================================
// Connection Direction Keywords
// ============================================

export const Northbound = createToken({ name: 'Northbound', pattern: /northbound/, longer_alt: Identifier });
export const Southbound = createToken({ name: 'Southbound', pattern: /southbound/, longer_alt: Identifier });
export const Eastbound = createToken({ name: 'Eastbound', pattern: /eastbound/, longer_alt: Identifier });
export const Westbound = createToken({ name: 'Westbound', pattern: /westbound/, longer_alt: Identifier });

// ============================================
// Endpoint Types
// ============================================

export const Api = createToken({ name: 'Api', pattern: /api/, longer_alt: Identifier });
export const Events = createToken({ name: 'Events', pattern: /events/, longer_alt: Identifier });
export const Stream = createToken({ name: 'Stream', pattern: /stream/, longer_alt: Identifier });

// ============================================
// External/User Property Keywords
// ============================================

export const Provides = createToken({ name: 'Provides', pattern: /provides/, longer_alt: Identifier });

// ============================================
// External Types
// ============================================

export const Saas = createToken({ name: 'Saas', pattern: /saas/, longer_alt: Identifier });
export const Partner = createToken({ name: 'Partner', pattern: /partner/, longer_alt: Identifier });
export const Enterprise = createToken({ name: 'Enterprise', pattern: /enterprise/, longer_alt: Identifier });

// ============================================
// User Types
// ============================================

export const Internal = createToken({ name: 'Internal', pattern: /internal/, longer_alt: Identifier });
export const System = createToken({ name: 'System', pattern: /system/, longer_alt: Identifier });

// ============================================
// Attribute Keywords
// ============================================

export const Tech = createToken({ name: 'Tech', pattern: /tech/, longer_alt: Identifier });
export const Replicas = createToken({ name: 'Replicas', pattern: /replicas/, longer_alt: Identifier });
export const Role = createToken({ name: 'Role', pattern: /role/, longer_alt: Identifier });
export const Sidecar = createToken({ name: 'Sidecar', pattern: /sidecar/, longer_alt: Identifier });
export const Provider = createToken({ name: 'Provider', pattern: /provider/, longer_alt: Identifier });
export const Protocol = createToken({ name: 'Protocol', pattern: /protocol/, longer_alt: Identifier });
export const Via = createToken({ name: 'Via', pattern: /via/, longer_alt: Identifier });
export const Version = createToken({ name: 'Version', pattern: /version/, longer_alt: Identifier });
export const Routes = createToken({ name: 'Routes', pattern: /routes/, longer_alt: Identifier });

// ============================================
// Boolean Literals
// ============================================

export const True = createToken({ name: 'True', pattern: /true/, longer_alt: Identifier });
export const False = createToken({ name: 'False', pattern: /false/, longer_alt: Identifier });

// ============================================
// Other Literals
// ============================================

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"/,
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?\d+(\.\d+)?/,
});

// ============================================
// Token Arrays for Organization
// ============================================

/** All cell type tokens */
export const cellTypeTokens: TokenType[] = [
  Logic, Integration, Data, Security, Channel, LegacyType,
];

/** All component type tokens (full names) */
export const componentTypeTokens: TokenType[] = [
  Microservice, Function, Database, Broker, Cache, Gateway,
  Idp, Sts, Userstore,
  Esb, Adapter, Transformer,
  Webapp, Mobile, Iot,
  LegacyType,
];

/** Component type alias tokens (short forms) */
export const componentTypeAliasTokens: TokenType[] = [Ms, Fn, Db];

/** All endpoint type tokens */
export const endpointTypeTokens: TokenType[] = [Api, Events, Stream];

/** Connection direction tokens */
export const directionTokens: TokenType[] = [
  Northbound, Southbound, Eastbound, Westbound,
];

/** External system type tokens */
export const externalTypeTokens: TokenType[] = [Saas, Partner, Enterprise];

/** User type tokens */
export const userTypeTokens: TokenType[] = [External, Internal, System];

/** All keyword tokens (for syntax highlighting) */
export const keywordTokens: TokenType[] = [
  // Top-level
  Diagram, Cell, External, User, Application, Connections,
  // Cell/Gateway properties
  Label, Type, Gateway, Components, Cluster,
  Exposes, Policies, Auth, Federated, LocalSts,
  // Cell types
  ...cellTypeTokens,
  // Component types
  ...componentTypeTokens,
  ...componentTypeAliasTokens,
  // Directions
  ...directionTokens,
  // Endpoint types
  ...endpointTypeTokens,
  // External/User
  Provides, Channels,
  ...externalTypeTokens,
  Internal, System,
  // Attributes
  Tech, Replicas, Role, Sidecar, Provider, Protocol, Via, Version, Cells, Routes,
  // Booleans
  True, False,
];

// ============================================
// Complete Token List (Order Matters!)
// ============================================

/**
 * All tokens in lexer priority order.
 * Longer tokens must come before shorter tokens that are prefixes.
 * longer_alt handles cases where keywords could be identifiers.
 */
export const allTokens: TokenType[] = [
  // Whitespace and comments (highest priority - skipped)
  WhiteSpace,
  LineComment,
  BlockComment,

  // Multi-character operators
  Arrow,
  LocalSts, // Must be before Identifier (contains hyphen)

  // Longer tokens must come BEFORE shorter prefix tokens
  // cells before cell, userstore before user, channels before channel, database before data
  Cells,
  Userstore,
  Channels,
  Database,

  // Top-level keywords
  Application,
  Connections,
  Diagram,
  External,
  Cell,
  User,

  // Cell/Gateway properties
  Components,
  Federated,
  Policies,
  Exposes,
  Gateway,
  Cluster,
  Label,
  Auth,
  Type,

  // Cell types
  Integration,
  Security,
  Channel,
  Logic,
  Data,

  // Component types (longest first)
  Microservice,
  Transformer,
  Function,
  Adapter,
  Webapp,
  Mobile,
  Broker,
  Cache,
  Idp,
  Sts,
  Esb,
  Iot,
  LegacyType,

  // Component type aliases
  Ms,
  Fn,
  Db,

  // Connection directions
  Northbound,
  Southbound,
  Eastbound,
  Westbound,

  // Endpoint types
  Events,
  Stream,
  Api,

  // External/User properties
  Provides,

  // External types
  Enterprise,
  Partner,
  Saas,

  // User types
  Internal,
  System,

  // Attribute keywords
  Protocol,
  Replicas,
  Provider,
  Sidecar,
  Version,
  Routes,
  Tech,
  Role,
  Via,

  // Boolean literals
  True,
  False,

  // Other literals
  StringLiteral,
  NumberLiteral,

  // Identifier (after all keywords)
  Identifier,

  // Single-character delimiters (lowest priority)
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  LParen,
  RParen,
  Colon,
  Comma,
  Dot,
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

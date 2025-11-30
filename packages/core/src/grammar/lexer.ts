/**
 * CellDL Lexer
 *
 * Tokenizes CellDL (Cell Definition Language) source code using Chevrotain.
 * Based on the CellDL specification for Cell-Based Architecture DSL.
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
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
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

// "workspace" vs "work"
export const Workspace = createToken({
  name: 'Workspace',
  pattern: /workspace/i,
  longer_alt: Identifier,
});

// "description" vs "desc"
export const Description = createToken({
  name: 'Description',
  pattern: /description/i,
  longer_alt: Identifier,
});

// "property" vs "prop"
export const Property = createToken({
  name: 'Property',
  pattern: /property/i,
  longer_alt: Identifier,
});

// "destination" must come before other tokens
export const Destination = createToken({
  name: 'Destination',
  pattern: /destination/i,
  longer_alt: Identifier,
});

// "userstore" vs "user"
export const Userstore = createToken({
  name: 'Userstore',
  pattern: /userstore/i,
  longer_alt: Identifier,
});

export const User = createToken({
  name: 'User',
  pattern: /user/i,
  longer_alt: Identifier,
});

// "database" vs "data"
export const Database = createToken({
  name: 'Database',
  pattern: /database/i,
  longer_alt: Identifier,
});

export const Data = createToken({
  name: 'Data',
  pattern: /data/i,
  longer_alt: Identifier,
});

// "components" vs "component"
export const Components = createToken({
  name: 'Components',
  pattern: /components/i,
  longer_alt: Identifier,
});

export const Component = createToken({
  name: 'Component',
  pattern: /component/i,
  longer_alt: Identifier,
});

// "cells" vs "cell"
export const Cells = createToken({
  name: 'Cells',
  pattern: /cells/i,
  longer_alt: Identifier,
});

export const Cell = createToken({
  name: 'Cell',
  pattern: /cell/i,
  longer_alt: Identifier,
});

// "channels" vs "channel"
export const Channels = createToken({
  name: 'Channels',
  pattern: /channels/i,
  longer_alt: Identifier,
});

export const Channel = createToken({
  name: 'Channel',
  pattern: /channel/i,
  longer_alt: Identifier,
});

// "connections" vs "connect"
export const Connections = createToken({
  name: 'Connections',
  pattern: /connections/i,
  longer_alt: Identifier,
});

// ============================================
// Top-Level Keywords
// ============================================

export const Diagram = createToken({ name: 'Diagram', pattern: /diagram/i, longer_alt: Identifier });
export const External = createToken({ name: 'External', pattern: /external/i, longer_alt: Identifier });
export const Application = createToken({ name: 'Application', pattern: /application/i, longer_alt: Identifier });
export const Flow = createToken({ name: 'Flow', pattern: /flow/i, longer_alt: Identifier });

// ============================================
// Cell & Gateway Keywords
// ============================================

export const Label = createToken({ name: 'Label', pattern: /label/i, longer_alt: Identifier });
export const Type = createToken({ name: 'Type', pattern: /type/i, longer_alt: Identifier });
export const Gateway = createToken({ name: 'Gateway', pattern: /gateway/i, longer_alt: Identifier });
export const Ingress = createToken({ name: 'Ingress', pattern: /ingress/i, longer_alt: Identifier });
export const Egress = createToken({ name: 'Egress', pattern: /egress/i, longer_alt: Identifier });
export const Cluster = createToken({ name: 'Cluster', pattern: /cluster/i, longer_alt: Identifier });
export const Exposes = createToken({ name: 'Exposes', pattern: /exposes/i, longer_alt: Identifier });
export const Policies = createToken({ name: 'Policies', pattern: /policies/i, longer_alt: Identifier });
export const Auth = createToken({ name: 'Auth', pattern: /auth/i, longer_alt: Identifier });
export const Federated = createToken({ name: 'Federated', pattern: /federated/i, longer_alt: Identifier });
export const LocalSts = createToken({ name: 'LocalSts', pattern: /local-sts/i });
// Routes must come before Route so "routes" doesn't get tokenized as "route" + "s"
export const Routes = createToken({ name: 'Routes', pattern: /routes/i, longer_alt: Identifier });
export const Route = createToken({ name: 'Route', pattern: /route/i, longer_alt: Routes });
export const Context = createToken({ name: 'Context', pattern: /context/i, longer_alt: Identifier });

// ============================================
// Cell Types
// ============================================

export const Logic = createToken({ name: 'Logic', pattern: /logic/i, longer_alt: Identifier });
export const Integration = createToken({ name: 'Integration', pattern: /integration/i, longer_alt: Identifier });
export const Security = createToken({ name: 'Security', pattern: /security/i, longer_alt: Identifier });
export const LegacyType = createToken({ name: 'LegacyType', pattern: /legacy/i, longer_alt: Identifier });

// ============================================
// Component Types (Full Names)
// ============================================

export const Microservice = createToken({ name: 'Microservice', pattern: /microservice/i, longer_alt: Identifier });
export const Function = createToken({ name: 'Function', pattern: /function/i, longer_alt: Identifier });
export const Broker = createToken({ name: 'Broker', pattern: /broker/i, longer_alt: Identifier });
export const Cache = createToken({ name: 'Cache', pattern: /cache/i, longer_alt: Identifier });

// Security Component Types
export const Idp = createToken({ name: 'Idp', pattern: /idp/i, longer_alt: Identifier });
export const Sts = createToken({ name: 'Sts', pattern: /sts/i, longer_alt: Identifier });

// Integration Component Types
export const Esb = createToken({ name: 'Esb', pattern: /esb/i, longer_alt: Identifier });
export const Adapter = createToken({ name: 'Adapter', pattern: /adapter/i, longer_alt: Identifier });
export const Transformer = createToken({ name: 'Transformer', pattern: /transformer/i, longer_alt: Identifier });

// Frontend Component Types
export const Webapp = createToken({ name: 'Webapp', pattern: /webapp/i, longer_alt: Identifier });
export const Mobile = createToken({ name: 'Mobile', pattern: /mobile/i, longer_alt: Identifier });
export const Iot = createToken({ name: 'Iot', pattern: /iot/i, longer_alt: Identifier });

// Component Type Aliases (Short Forms)
export const Ms = createToken({ name: 'Ms', pattern: /ms/i, longer_alt: Identifier });
export const Fn = createToken({ name: 'Fn', pattern: /fn/i, longer_alt: Identifier });
export const Db = createToken({ name: 'Db', pattern: /db/i, longer_alt: Identifier });

// ============================================
// Component Properties
// ============================================

export const Source = createToken({ name: 'Source', pattern: /source/i, longer_alt: Identifier });
export const Port = createToken({ name: 'Port', pattern: /port/i, longer_alt: Identifier });
export const Env = createToken({ name: 'Env', pattern: /env/i, longer_alt: Identifier });
export const Engine = createToken({ name: 'Engine', pattern: /engine/i, longer_alt: Identifier });
export const Storage = createToken({ name: 'Storage', pattern: /storage/i, longer_alt: Identifier });
export const Target = createToken({ name: 'Target', pattern: /target/i, longer_alt: Identifier });
export const Policy = createToken({ name: 'Policy', pattern: /policy/i, longer_alt: Identifier });

// ============================================
// Connection Direction Keywords
// ============================================

export const Northbound = createToken({ name: 'Northbound', pattern: /northbound/i, longer_alt: Identifier });
export const Southbound = createToken({ name: 'Southbound', pattern: /southbound/i, longer_alt: Identifier });
export const Eastbound = createToken({ name: 'Eastbound', pattern: /eastbound/i, longer_alt: Identifier });
export const Westbound = createToken({ name: 'Westbound', pattern: /westbound/i, longer_alt: Identifier });

// ============================================
// Endpoint Types
// ============================================

export const Api = createToken({ name: 'Api', pattern: /api/i, longer_alt: Identifier });
export const Events = createToken({ name: 'Events', pattern: /events/i, longer_alt: Identifier });
export const Stream = createToken({ name: 'Stream', pattern: /stream/i, longer_alt: Identifier });

// ============================================
// Protocol Keywords
// ============================================

export const Https = createToken({ name: 'Https', pattern: /https/i, longer_alt: Identifier });
export const Http = createToken({ name: 'Http', pattern: /http/i, longer_alt: Identifier });
export const Grpc = createToken({ name: 'Grpc', pattern: /grpc/i, longer_alt: Identifier });
export const Tcp = createToken({ name: 'Tcp', pattern: /tcp/i, longer_alt: Identifier });
export const Mtls = createToken({ name: 'Mtls', pattern: /mtls/i, longer_alt: Identifier });
export const Kafka = createToken({ name: 'Kafka', pattern: /kafka/i, longer_alt: Identifier });

// ============================================
// External/User Property Keywords
// ============================================

export const Provides = createToken({ name: 'Provides', pattern: /provides/i, longer_alt: Identifier });

// ============================================
// External Types
// ============================================

export const Saas = createToken({ name: 'Saas', pattern: /saas/i, longer_alt: Identifier });
export const Partner = createToken({ name: 'Partner', pattern: /partner/i, longer_alt: Identifier });
export const Enterprise = createToken({ name: 'Enterprise', pattern: /enterprise/i, longer_alt: Identifier });

// ============================================
// User Types
// ============================================

export const Internal = createToken({ name: 'Internal', pattern: /internal/i, longer_alt: Identifier });
export const System = createToken({ name: 'System', pattern: /system/i, longer_alt: Identifier });

// ============================================
// Attribute Keywords
// ============================================

export const Tech = createToken({ name: 'Tech', pattern: /tech/i, longer_alt: Identifier });
export const Replicas = createToken({ name: 'Replicas', pattern: /replicas/i, longer_alt: Identifier });
export const Role = createToken({ name: 'Role', pattern: /role/i, longer_alt: Identifier });
export const Sidecar = createToken({ name: 'Sidecar', pattern: /sidecar/i, longer_alt: Identifier });
export const Provider = createToken({ name: 'Provider', pattern: /provider/i, longer_alt: Identifier });
export const Protocol = createToken({ name: 'Protocol', pattern: /protocol/i, longer_alt: Identifier });
export const Via = createToken({ name: 'Via', pattern: /via/i, longer_alt: Identifier });
export const Version = createToken({ name: 'Version', pattern: /version/i, longer_alt: Identifier });

// ============================================
// Boolean Literals
// ============================================

export const True = createToken({ name: 'True', pattern: /true/i, longer_alt: Identifier });
export const False = createToken({ name: 'False', pattern: /false/i, longer_alt: Identifier });

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

/** Protocol tokens */
export const protocolTokens: TokenType[] = [Https, Http, Grpc, Tcp, Mtls, Kafka];

/** All keyword tokens (for syntax highlighting) */
export const keywordTokens: TokenType[] = [
  // Top-level
  Workspace, Diagram, Cell, External, User, Application, Connections, Flow,
  // Cell/Gateway properties
  Label, Type, Gateway, Ingress, Egress, Components, Component, Cluster,
  Exposes, Policies, Auth, Federated, LocalSts, Route, Context,
  Description, Property,
  // Cell types
  ...cellTypeTokens,
  // Component types
  ...componentTypeTokens,
  ...componentTypeAliasTokens,
  // Component properties
  Source, Port, Env, Engine, Storage, Target, Policy,
  // Directions
  ...directionTokens,
  // Endpoint types
  ...endpointTypeTokens,
  // Protocols
  ...protocolTokens,
  // External/User
  Provides, Channels,
  ...externalTypeTokens,
  Internal, System,
  // Attributes
  Tech, Replicas, Role, Sidecar, Provider, Protocol, Via, Version, Cells,
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
  // workspace, description, property, destination first
  Workspace,
  Description,
  Destination,
  Property,

  // cells before cell, userstore before user, channels before channel, database before data
  // components before component, connections
  Cells,
  Userstore,
  Channels,
  Database,
  Components,
  Connections,

  // Top-level keywords
  Application,
  Diagram,
  External,
  Cell,
  User,
  Flow,

  // Cell/Gateway properties
  Component,
  Federated,
  Policies,
  Exposes,
  Gateway,
  Ingress,
  Egress,
  Cluster,
  Context,
  Label,
  Routes, // Must come before Route
  Route,
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

  // Component properties
  Storage,
  Engine,
  Source,
  Target,
  Policy,
  Port,
  Env,

  // Connection directions
  Northbound,
  Southbound,
  Eastbound,
  Westbound,

  // Endpoint types
  Events,
  Stream,
  Api,

  // Protocol types (longer first)
  Https,
  Http,
  Grpc,
  Mtls,
  Kafka,
  Tcp,

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
  Equals,
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
 * The CellDL lexer instance.
 * Use CellDLLexer.tokenize(source) to tokenize source code.
 */
export const CellDiagramsLexer = new Lexer(allTokens, {
  ensureOptimizations: true,
  positionTracking: 'full',
});

// Alias for CellDL naming
export const CellDLLexer = CellDiagramsLexer;

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

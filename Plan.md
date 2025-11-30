# Cell Diagrams - Claude Code Implementation Plan

## 🤖 CLAUDE CODE INSTRUCTIONS

> **This document is designed for Claude Code to implement step-by-step.**
> 
> ### How to use this plan:
> 1. Start with Phase 1 and complete each task sequentially
> 2. Each task includes the exact file path and complete code
> 3. Run verification commands after each phase
> 4. Mark checkboxes as you complete tasks
> 
> ### Commands for Claude Code:
> - "Implement Phase 1" - Sets up the monorepo structure
> - "Implement Phase 2" - Creates the core parser package
> - "Implement Phase 3" - Creates the renderer package
> - "Continue from Task X.Y" - Resume from a specific task
> - "Verify Phase X" - Run tests and type checks for a phase

---

## Project Overview

**Cell Diagrams** is a toolkit for creating Cell-Based Architecture diagrams (based on WSO2 reference architecture) using a custom DSL, similar to how Mermaid works for sequence diagrams.

### Deliverables

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| `@cell-diagrams/core` | Parser + AST using Chevrotain | P0 |
| `@cell-diagrams/renderer` | React Flow diagram renderer | P0 |
| `apps/web` | Web editor with Monaco + live preview | P0 |
| `extensions/vscode` | VS Code extension with LSP | P1 |
| `@cell-diagrams/cli` | CLI for CI/CD pipelines | P2 |
| `apps/embed` | Lightweight embeddable widget | P2 |
| `apps/collab-server` | Real-time collaboration server | P3 |

### Naming Conventions

- **Package Scope**: `@cell-diagrams/*`
- **File Extension**: `.cell`
- **Language ID**: `cell-diagrams`
- **MIME Type**: `text/x-cell-diagrams`

---

## Technology Stack

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| Package Manager | pnpm | ^9.0.0 | Fast, efficient disk usage |
| Build System | Turborepo | ^2.0.0 | Incremental builds, caching |
| Language | TypeScript | ^5.4.0 | Type safety across packages |
| Parser | Chevrotain | ^11.0.3 | Fast, fault-tolerant, TS native |
| Web Framework | React | ^18.3.0 | Component ecosystem |
| Diagram Library | React Flow | ^11.11.0 | Native React/HTML nodes, MIT |
| Code Editor (Web) | Monaco Editor | ^0.50.0 | VS Code parity |
| Bundler (apps) | Vite | ^5.4.0 | Fast HMR, ESM native |
| Bundler (packages) | tsup | ^8.2.0 | Zero-config TS bundler |
| Testing | Vitest | ^2.0.0 | Fast, Vite-native |
| Collaboration | Yjs + Hocuspocus | ^13.0.0 / ^2.0.0 | CRDT, battle-tested |

---

## Directory Structure

```
cell-diagrams/
├── apps/
│   ├── web/                    # Main web application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── monaco/         # Monaco configuration
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── embed/                  # Embeddable widget (P2)
│   ├── collab-server/          # Hocuspocus server (P3)
│   └── docs/                   # Documentation site (P2)
├── packages/
│   ├── core/                   # Parser & AST
│   │   ├── src/
│   │   │   ├── ast/            # AST type definitions
│   │   │   ├── grammar/        # Lexer, parser, visitor
│   │   │   ├── parser.ts       # Main parse function
│   │   │   ├── stringify.ts    # AST to source
│   │   │   └── index.ts        # Public API
│   │   └── package.json
│   ├── renderer/               # React Flow renderer
│   │   ├── src/
│   │   │   ├── nodes/          # Custom node components
│   │   │   ├── edges/          # Custom edge components
│   │   │   ├── components/     # Main diagram component
│   │   │   ├── converter.ts    # AST <-> Diagram state
│   │   │   ├── types.ts        # Diagram types
│   │   │   └── index.ts
│   │   └── package.json
│   ├── editor-support/         # Monaco + CodeMirror configs
│   ├── language-server/        # LSP implementation
│   ├── collab-client/          # Yjs client library
│   ├── sharing/                # URL encoding, Gist
│   └── cli/                    # Command-line tool
├── extensions/
│   └── vscode/                 # VS Code extension
├── examples/                   # Example .cell files
├── package.json                # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

# PHASE 1: MONOREPO SETUP

## Task 1.1: Create Project Root

**Commands to run:**
```bash
mkdir cell-diagrams && cd cell-diagrams
pnpm init
```

**File: `package.json`**
```json
{
  "name": "cell-diagrams",
  "version": "0.1.0",
  "private": true,
  "description": "Cell-Based Architecture Diagram Toolkit",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules .turbo",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "prettier": "^3.3.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.4.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

## Task 1.2: Create Workspace Configuration

**File: `pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'extensions/*'
```

## Task 1.3: Create Turborepo Configuration

**File: `turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Task 1.4: Create Shared TypeScript Configuration

**File: `tsconfig.base.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## Task 1.5: Create Prettier Configuration

**File: `.prettierrc`**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## Task 1.6: Create .gitignore

**File: `.gitignore`**
```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
*.tsbuildinfo

# Turbo
.turbo/

# Testing
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
```

## Task 1.7: Create Directory Structure

**Commands to run:**
```bash
# Create all directories
mkdir -p apps/{web,embed,collab-server,docs}
mkdir -p packages/{core,renderer,editor-support,language-server,collab-client,sharing,cli}
mkdir -p extensions/vscode
mkdir -p examples

# Create placeholder files
touch apps/.gitkeep
touch extensions/.gitkeep
touch examples/.gitkeep
```

## Task 1.8: Install Root Dependencies

**Commands to run:**
```bash
pnpm install
```

### ✅ Phase 1 Verification

```bash
# Verify structure
ls -la
ls -la apps/
ls -la packages/

# Verify pnpm workspace
pnpm ls

# Should show no errors
```

---

# PHASE 2: CORE PACKAGE (Parser & AST)

## Task 2.1: Initialize @cell-diagrams/core Package

**File: `packages/core/package.json`**
```json
{
  "name": "@cell-diagrams/core",
  "version": "0.1.0",
  "description": "Parser and AST for Cell Diagrams DSL",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./lexer": {
      "import": "./dist/grammar/lexer.js",
      "types": "./dist/grammar/lexer.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist coverage"
  },
  "dependencies": {
    "chevrotain": "^11.0.3"
  },
  "devDependencies": {
    "tsup": "^8.2.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  },
  "keywords": ["cell-diagrams", "parser", "ast", "dsl"],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/cell-diagrams",
    "directory": "packages/core"
  }
}
```

**File: `packages/core/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

**File: `packages/core/tsup.config.ts`**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/grammar/lexer.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

**File: `packages/core/vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## Task 2.2: Define AST Types

**File: `packages/core/src/ast/types.ts`**
```typescript
/**
 * Cell Diagrams AST Type Definitions
 * 
 * This module defines the Abstract Syntax Tree structure for Cell Diagrams DSL.
 * The AST represents the semantic structure of a cell-based architecture diagram.
 */

// ============================================
// Source Location Types
// ============================================

export interface Position {
  /** 1-based line number */
  line: number;
  /** 1-based column number */
  column: number;
  /** 0-based character offset */
  offset: number;
}

export interface Location {
  start: Position;
  end: Position;
}

// ============================================
// Base Node
// ============================================

export interface BaseNode {
  type: string;
  location?: Location;
}

// ============================================
// Enumerated Types
// ============================================

/** Types of components that can exist within a cell */
export type ComponentType =
  | 'microservice'
  | 'function'
  | 'database'
  | 'gateway'
  | 'service'
  | 'broker'
  | 'cache'
  | 'legacy'
  | 'esb'
  | 'idp';

/** Short codes for component types used in DSL syntax */
export type ComponentTypeShort =
  | 'ms'      // microservice
  | 'fn'      // function
  | 'db'      // database
  | 'gw'      // gateway
  | 'svc'     // service
  | 'broker'  // message broker
  | 'cache'   // cache
  | 'legacy'  // legacy system
  | 'esb'     // enterprise service bus
  | 'idp';    // identity provider

/** Cell classification types */
export type CellType =
  | 'logic'       // Business logic cell
  | 'integration' // Integration/adapter cell
  | 'legacy'      // Legacy wrapper cell
  | 'data'        // Data management cell
  | 'security'    // Security/identity cell
  | 'channel'     // Channel/presentation cell
  | 'external';   // External system (not really a cell)

/** Types of exposed endpoints */
export type EndpointType =
  | 'api'     // REST/GraphQL API
  | 'event'   // Event/message
  | 'stream'; // Data stream

/** Connection direction for traffic flow */
export type ConnectionDirection =
  | 'northbound'  // External -> Cell
  | 'southbound'  // Cell -> External
  | 'eastbound'   // Cell -> Cell (same tier)
  | 'westbound';  // Cell -> Cell (same tier)

// ============================================
// AST Node Definitions
// ============================================

/** Root node of the AST */
export interface Program extends BaseNode {
  type: 'Program';
  statements: Statement[];
}

/** Union of all top-level statement types */
export type Statement =
  | CellDefinition
  | ExternalDefinition
  | UserDefinition
  | Connection;

/** Cell definition with components and connections */
export interface CellDefinition extends BaseNode {
  type: 'CellDefinition';
  /** Unique identifier for the cell */
  id: string;
  /** Human-readable display name */
  name?: string;
  /** Cell classification */
  cellType?: CellType;
  /** Components within the cell */
  components: ComponentDefinition[];
  /** Internal connections between components */
  internalConnections: InternalConnection[];
  /** Exposed endpoints (gateways) */
  exposedEndpoints: EndpointDefinition[];
}

/** Component within a cell */
export interface ComponentDefinition extends BaseNode {
  type: 'ComponentDefinition';
  /** Unique identifier for the component */
  id: string;
  /** Type of component */
  componentType: ComponentType;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Connection between components within a cell */
export interface InternalConnection extends BaseNode {
  type: 'InternalConnection';
  /** Source component ID */
  source: string;
  /** Target component ID */
  target: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Exposed endpoint definition */
export interface EndpointDefinition extends BaseNode {
  type: 'EndpointDefinition';
  /** Type of endpoint */
  endpointType: EndpointType;
  /** Reference to the component that handles this endpoint */
  componentRef: string;
  /** Additional attributes (e.g., path, protocol) */
  attributes: Attribute[];
}

/** External system definition */
export interface ExternalDefinition extends BaseNode {
  type: 'ExternalDefinition';
  /** Unique identifier */
  id: string;
  /** Display name */
  name?: string;
  /** Type of external system (saas, partner, etc.) */
  externalType?: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** User/actor definition */
export interface UserDefinition extends BaseNode {
  type: 'UserDefinition';
  /** Unique identifier */
  id: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Inter-cell or user-to-cell connection */
export interface Connection extends BaseNode {
  type: 'Connection';
  /** Source cell/user/external ID */
  source: string;
  /** Target cell/external ID */
  target: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Key-value attribute */
export interface Attribute extends BaseNode {
  type: 'Attribute';
  /** Attribute key */
  key: string;
  /** Attribute value (optional for boolean flags) */
  value?: string | number | boolean;
}

// ============================================
// Type Guards
// ============================================

export function isCellDefinition(node: Statement): node is CellDefinition {
  return node.type === 'CellDefinition';
}

export function isExternalDefinition(node: Statement): node is ExternalDefinition {
  return node.type === 'ExternalDefinition';
}

export function isUserDefinition(node: Statement): node is UserDefinition {
  return node.type === 'UserDefinition';
}

export function isConnection(node: Statement): node is Connection {
  return node.type === 'Connection';
}

// ============================================
// Utility Types
// ============================================

/** Map from short code to full component type */
export const COMPONENT_TYPE_MAP: Record<ComponentTypeShort, ComponentType> = {
  ms: 'microservice',
  fn: 'function',
  db: 'database',
  gw: 'gateway',
  svc: 'service',
  broker: 'broker',
  cache: 'cache',
  legacy: 'legacy',
  esb: 'esb',
  idp: 'idp',
};

/** Map from full component type to short code */
export const COMPONENT_TYPE_REVERSE_MAP: Record<ComponentType, ComponentTypeShort> = {
  microservice: 'ms',
  function: 'fn',
  database: 'db',
  gateway: 'gw',
  service: 'svc',
  broker: 'broker',
  cache: 'cache',
  legacy: 'legacy',
  esb: 'esb',
  idp: 'idp',
};
```

## Task 2.3: Implement Chevrotain Lexer

**File: `packages/core/src/grammar/lexer.ts`**
```typescript
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
```

## Task 2.4: Implement Chevrotain Parser

**File: `packages/core/src/grammar/parser.ts`**
```typescript
/**
 * Cell Diagrams Parser
 * 
 * Parses tokenized Cell Diagrams DSL into a Concrete Syntax Tree (CST).
 * Uses Chevrotain's CstParser with error recovery enabled.
 */

import { CstParser, CstNode } from 'chevrotain';
import {
  allTokens,
  Cell,
  External,
  User,
  Connect,
  Components,
  Expose,
  Name,
  Type,
  Identifier,
  StringLiteral,
  NumberLiteral,
  True,
  False,
  Arrow,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Colon,
  Comma,
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
  Api,
  Event,
  Stream,
  Logic,
  Integration,
  Data,
  Security,
  Channel,
} from './lexer';

// ============================================
// Parser Definition
// ============================================

export class CellDiagramsParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      maxLookahead: 3,
    });
    this.performSelfAnalysis();
  }

  // ========================================
  // Grammar Rules
  // ========================================

  /**
   * Program = Statement*
   */
  public program = this.RULE('program', () => {
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
  });

  /**
   * Statement = CellDefinition | ExternalDefinition | UserDefinition | Connection
   */
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.cellDefinition) },
      { ALT: () => this.SUBRULE(this.externalDefinition) },
      { ALT: () => this.SUBRULE(this.userDefinition) },
      { ALT: () => this.SUBRULE(this.connection) },
    ]);
  });

  /**
   * CellDefinition = "cell" Identifier "{" CellBodyItem* "}"
   */
  private cellDefinition = this.RULE('cellDefinition', () => {
    this.CONSUME(Cell);
    this.CONSUME(Identifier, { LABEL: 'cellId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.cellBodyItem);
    });
    this.CONSUME(RBrace);
  });

  /**
   * CellBodyItem = NameProperty | TypeProperty | ComponentsBlock | ConnectBlock | ExposeBlock
   */
  private cellBodyItem = this.RULE('cellBodyItem', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.nameProperty) },
      { ALT: () => this.SUBRULE(this.typeProperty) },
      { ALT: () => this.SUBRULE(this.componentsBlock) },
      { ALT: () => this.SUBRULE(this.connectBlock) },
      { ALT: () => this.SUBRULE(this.exposeBlock) },
    ]);
  });

  /**
   * NameProperty = "name" ":" StringLiteral
   */
  private nameProperty = this.RULE('nameProperty', () => {
    this.CONSUME(Name);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  /**
   * TypeProperty = "type" ":" CellType
   */
  private typeProperty = this.RULE('typeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.SUBRULE(this.cellTypeValue);
  });

  /**
   * CellType = "logic" | "integration" | "legacy" | "data" | "security" | "channel"
   */
  private cellTypeValue = this.RULE('cellTypeValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Logic) },
      { ALT: () => this.CONSUME(Integration) },
      { ALT: () => this.CONSUME(Legacy) },
      { ALT: () => this.CONSUME(Data) },
      { ALT: () => this.CONSUME(Security) },
      { ALT: () => this.CONSUME(Channel) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'customType' }) },
    ]);
  });

  /**
   * ComponentsBlock = "components" "{" ComponentDefinition* "}"
   */
  private componentsBlock = this.RULE('componentsBlock', () => {
    this.CONSUME(Components);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.componentDefinition);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ComponentDefinition = ComponentType Identifier Attributes?
   */
  private componentDefinition = this.RULE('componentDefinition', () => {
    this.SUBRULE(this.componentType);
    this.CONSUME(Identifier, { LABEL: 'componentId' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * ComponentType = "ms" | "fn" | "db" | "gw" | "svc" | "broker" | "cache" | "legacy" | "esb" | "idp"
   */
  private componentType = this.RULE('componentType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Ms) },
      { ALT: () => this.CONSUME(Fn) },
      { ALT: () => this.CONSUME(Db) },
      { ALT: () => this.CONSUME(Gw) },
      { ALT: () => this.CONSUME(Svc) },
      { ALT: () => this.CONSUME(Broker) },
      { ALT: () => this.CONSUME(Cache) },
      { ALT: () => this.CONSUME(Legacy) },
      { ALT: () => this.CONSUME(Esb) },
      { ALT: () => this.CONSUME(Idp) },
    ]);
  });

  /**
   * ConnectBlock = "connect" "{" InternalConnection* "}"
   */
  private connectBlock = this.RULE('connectBlock', () => {
    this.CONSUME(Connect);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.internalConnection);
    });
    this.CONSUME(RBrace);
  });

  /**
   * InternalConnection = Identifier "->" Identifier Attributes?
   */
  private internalConnection = this.RULE('internalConnection', () => {
    this.CONSUME1(Identifier, { LABEL: 'source' });
    this.CONSUME(Arrow);
    this.CONSUME2(Identifier, { LABEL: 'target' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * ExposeBlock = "expose" "{" EndpointDefinition* "}"
   */
  private exposeBlock = this.RULE('exposeBlock', () => {
    this.CONSUME(Expose);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.endpointDefinition);
    });
    this.CONSUME(RBrace);
  });

  /**
   * EndpointDefinition = EndpointType ":" Identifier Attributes?
   */
  private endpointDefinition = this.RULE('endpointDefinition', () => {
    this.SUBRULE(this.endpointType);
    this.CONSUME(Colon);
    this.CONSUME(Identifier, { LABEL: 'componentRef' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * EndpointType = "api" | "event" | "stream"
   */
  private endpointType = this.RULE('endpointType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Api) },
      { ALT: () => this.CONSUME(Event) },
      { ALT: () => this.CONSUME(Stream) },
    ]);
  });

  /**
   * ExternalDefinition = "external" Identifier "{" (NameProperty | TypeProperty)* "}"
   */
  private externalDefinition = this.RULE('externalDefinition', () => {
    this.CONSUME(External);
    this.CONSUME(Identifier, { LABEL: 'externalId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.nameProperty) },
        { ALT: () => this.SUBRULE(this.externalTypeProperty) },
      ]);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ExternalTypeProperty = "type" ":" (Identifier | StringLiteral)
   */
  private externalTypeProperty = this.RULE('externalTypeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'typeValue' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'typeValue' }) },
    ]);
  });

  /**
   * UserDefinition = "user" Identifier Attributes?
   */
  private userDefinition = this.RULE('userDefinition', () => {
    this.CONSUME(User);
    this.CONSUME(Identifier, { LABEL: 'userId' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * Connection = "connect" Identifier "->" Identifier Attributes?
   */
  private connection = this.RULE('connection', () => {
    this.CONSUME(Connect);
    this.CONSUME1(Identifier, { LABEL: 'source' });
    this.CONSUME(Arrow);
    this.CONSUME2(Identifier, { LABEL: 'target' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * Attributes = "[" Attribute ("," Attribute)* "]"
   */
  private attributes = this.RULE('attributes', () => {
    this.CONSUME(LBracket);
    this.SUBRULE1(this.attribute);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.attribute);
    });
    this.CONSUME(RBracket);
  });

  /**
   * Attribute = Identifier (":" Value)?
   */
  private attribute = this.RULE('attribute', () => {
    this.CONSUME(Identifier, { LABEL: 'key' });
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.value);
    });
  });

  /**
   * Value = StringLiteral | NumberLiteral | "true" | "false" | Identifier
   */
  private value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'identifierValue' }) },
    ]);
  });
}

// ============================================
// Singleton Parser Instance
// ============================================

/**
 * Singleton parser instance.
 * Reuse this instance for performance.
 */
export const parserInstance = new CellDiagramsParser();

/**
 * Get the CST visitor constructor for building visitors.
 */
export function getBaseCstVisitorConstructor() {
  return parserInstance.getBaseCstVisitorConstructor();
}

/**
 * Get the CST visitor constructor with defaults.
 */
export function getBaseCstVisitorConstructorWithDefaults() {
  return parserInstance.getBaseCstVisitorConstructorWithDefaults();
}
```

## Task 2.5: Implement CST to AST Visitor

**File: `packages/core/src/grammar/visitor.ts`**
```typescript
/**
 * Cell Diagrams CST Visitor
 * 
 * Transforms the Concrete Syntax Tree (CST) into an Abstract Syntax Tree (AST).
 */

import { CstNode, IToken } from 'chevrotain';
import { getBaseCstVisitorConstructor } from './parser';
import {
  Program,
  Statement,
  CellDefinition,
  ComponentDefinition,
  InternalConnection,
  EndpointDefinition,
  ExternalDefinition,
  UserDefinition,
  Connection,
  Attribute,
  ComponentType,
  CellType,
  EndpointType,
  COMPONENT_TYPE_MAP,
  ComponentTypeShort,
} from '../ast/types';

// ============================================
// CST Context Types
// ============================================

interface ProgramCstContext {
  statement?: CstNode[];
}

interface CellDefinitionCstContext {
  cellId: IToken[];
  cellBodyItem?: CstNode[];
}

interface CellBodyItemCstContext {
  nameProperty?: CstNode[];
  typeProperty?: CstNode[];
  componentsBlock?: CstNode[];
  connectBlock?: CstNode[];
  exposeBlock?: CstNode[];
}

interface NamePropertyCstContext {
  StringLiteral: IToken[];
}

interface TypePropertyCstContext {
  cellTypeValue: CstNode[];
}

interface CellTypeValueCstContext {
  Logic?: IToken[];
  Integration?: IToken[];
  Legacy?: IToken[];
  Data?: IToken[];
  Security?: IToken[];
  Channel?: IToken[];
  customType?: IToken[];
}

interface ComponentsBlockCstContext {
  componentDefinition?: CstNode[];
}

interface ComponentDefinitionCstContext {
  componentType: CstNode[];
  componentId: IToken[];
  attributes?: CstNode[];
}

interface ComponentTypeCstContext {
  Ms?: IToken[];
  Fn?: IToken[];
  Db?: IToken[];
  Gw?: IToken[];
  Svc?: IToken[];
  Broker?: IToken[];
  Cache?: IToken[];
  Legacy?: IToken[];
  Esb?: IToken[];
  Idp?: IToken[];
}

interface ConnectBlockCstContext {
  internalConnection?: CstNode[];
}

interface InternalConnectionCstContext {
  source: IToken[];
  target: IToken[];
  attributes?: CstNode[];
}

interface ExposeBlockCstContext {
  endpointDefinition?: CstNode[];
}

interface EndpointDefinitionCstContext {
  endpointType: CstNode[];
  componentRef: IToken[];
  attributes?: CstNode[];
}

interface EndpointTypeCstContext {
  Api?: IToken[];
  Event?: IToken[];
  Stream?: IToken[];
}

interface ExternalDefinitionCstContext {
  externalId: IToken[];
  nameProperty?: CstNode[];
  externalTypeProperty?: CstNode[];
}

interface ExternalTypePropertyCstContext {
  typeValue: IToken[];
}

interface UserDefinitionCstContext {
  userId: IToken[];
  attributes?: CstNode[];
}

interface ConnectionCstContext {
  source: IToken[];
  target: IToken[];
  attributes?: CstNode[];
}

interface AttributesCstContext {
  attribute: CstNode[];
}

interface AttributeCstContext {
  key: IToken[];
  value?: CstNode[];
}

interface ValueCstContext {
  StringLiteral?: IToken[];
  NumberLiteral?: IToken[];
  True?: IToken[];
  False?: IToken[];
  identifierValue?: IToken[];
}

// ============================================
// Visitor Implementation
// ============================================

const BaseCstVisitor = getBaseCstVisitorConstructor();

class CellDiagramsVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  program(ctx: ProgramCstContext): Program {
    const statements: Statement[] = [];

    if (ctx.statement) {
      for (const stmtNode of ctx.statement) {
        const stmt = this.visit(stmtNode);
        if (stmt) {
          statements.push(stmt);
        }
      }
    }

    return {
      type: 'Program',
      statements,
    };
  }

  statement(ctx: any): Statement | null {
    if (ctx.cellDefinition) {
      return this.visit(ctx.cellDefinition[0]);
    }
    if (ctx.externalDefinition) {
      return this.visit(ctx.externalDefinition[0]);
    }
    if (ctx.userDefinition) {
      return this.visit(ctx.userDefinition[0]);
    }
    if (ctx.connection) {
      return this.visit(ctx.connection[0]);
    }
    return null;
  }

  cellDefinition(ctx: CellDefinitionCstContext): CellDefinition {
    const id = ctx.cellId[0].image;
    let name: string | undefined;
    let cellType: CellType | undefined;
    const components: ComponentDefinition[] = [];
    const internalConnections: InternalConnection[] = [];
    const exposedEndpoints: EndpointDefinition[] = [];

    if (ctx.cellBodyItem) {
      for (const item of ctx.cellBodyItem) {
        const result = this.visit(item);
        if (result) {
          if (result._type === 'name') {
            name = result.value;
          } else if (result._type === 'cellType') {
            cellType = result.value;
          } else if (result._type === 'components') {
            components.push(...result.value);
          } else if (result._type === 'connections') {
            internalConnections.push(...result.value);
          } else if (result._type === 'endpoints') {
            exposedEndpoints.push(...result.value);
          }
        }
      }
    }

    return {
      type: 'CellDefinition',
      id,
      name,
      cellType,
      components,
      internalConnections,
      exposedEndpoints,
    };
  }

  cellBodyItem(ctx: CellBodyItemCstContext): any {
    if (ctx.nameProperty) {
      const value = this.visit(ctx.nameProperty[0]);
      return { _type: 'name', value };
    }
    if (ctx.typeProperty) {
      const value = this.visit(ctx.typeProperty[0]);
      return { _type: 'cellType', value };
    }
    if (ctx.componentsBlock) {
      const value = this.visit(ctx.componentsBlock[0]);
      return { _type: 'components', value };
    }
    if (ctx.connectBlock) {
      const value = this.visit(ctx.connectBlock[0]);
      return { _type: 'connections', value };
    }
    if (ctx.exposeBlock) {
      const value = this.visit(ctx.exposeBlock[0]);
      return { _type: 'endpoints', value };
    }
    return null;
  }

  nameProperty(ctx: NamePropertyCstContext): string {
    const raw = ctx.StringLiteral[0].image;
    return raw.slice(1, -1); // Remove quotes
  }

  typeProperty(ctx: TypePropertyCstContext): CellType {
    return this.visit(ctx.cellTypeValue[0]);
  }

  cellTypeValue(ctx: CellTypeValueCstContext): CellType {
    if (ctx.Logic) return 'logic';
    if (ctx.Integration) return 'integration';
    if (ctx.Legacy) return 'legacy';
    if (ctx.Data) return 'data';
    if (ctx.Security) return 'security';
    if (ctx.Channel) return 'channel';
    if (ctx.customType) return ctx.customType[0].image as CellType;
    return 'logic';
  }

  componentsBlock(ctx: ComponentsBlockCstContext): ComponentDefinition[] {
    const components: ComponentDefinition[] = [];
    if (ctx.componentDefinition) {
      for (const compNode of ctx.componentDefinition) {
        components.push(this.visit(compNode));
      }
    }
    return components;
  }

  componentDefinition(ctx: ComponentDefinitionCstContext): ComponentDefinition {
    const componentType = this.visit(ctx.componentType[0]) as ComponentType;
    const id = ctx.componentId[0].image;
    const attributes = ctx.attributes ? this.visit(ctx.attributes[0]) : [];

    return {
      type: 'ComponentDefinition',
      id,
      componentType,
      attributes,
    };
  }

  componentType(ctx: ComponentTypeCstContext): ComponentType {
    if (ctx.Ms) return COMPONENT_TYPE_MAP['ms'];
    if (ctx.Fn) return COMPONENT_TYPE_MAP['fn'];
    if (ctx.Db) return COMPONENT_TYPE_MAP['db'];
    if (ctx.Gw) return COMPONENT_TYPE_MAP['gw'];
    if (ctx.Svc) return COMPONENT_TYPE_MAP['svc'];
    if (ctx.Broker) return COMPONENT_TYPE_MAP['broker'];
    if (ctx.Cache) return COMPONENT_TYPE_MAP['cache'];
    if (ctx.Legacy) return COMPONENT_TYPE_MAP['legacy'];
    if (ctx.Esb) return COMPONENT_TYPE_MAP['esb'];
    if (ctx.Idp) return COMPONENT_TYPE_MAP['idp'];
    return 'service';
  }

  connectBlock(ctx: ConnectBlockCstContext): InternalConnection[] {
    const connections: InternalConnection[] = [];
    if (ctx.internalConnection) {
      for (const connNode of ctx.internalConnection) {
        connections.push(this.visit(connNode));
      }
    }
    return connections;
  }

  internalConnection(ctx: InternalConnectionCstContext): InternalConnection {
    return {
      type: 'InternalConnection',
      source: ctx.source[0].image,
      target: ctx.target[0].image,
      attributes: ctx.attributes ? this.visit(ctx.attributes[0]) : [],
    };
  }

  exposeBlock(ctx: ExposeBlockCstContext): EndpointDefinition[] {
    const endpoints: EndpointDefinition[] = [];
    if (ctx.endpointDefinition) {
      for (const epNode of ctx.endpointDefinition) {
        endpoints.push(this.visit(epNode));
      }
    }
    return endpoints;
  }

  endpointDefinition(ctx: EndpointDefinitionCstContext): EndpointDefinition {
    return {
      type: 'EndpointDefinition',
      endpointType: this.visit(ctx.endpointType[0]),
      componentRef: ctx.componentRef[0].image,
      attributes: ctx.attributes ? this.visit(ctx.attributes[0]) : [],
    };
  }

  endpointType(ctx: EndpointTypeCstContext): EndpointType {
    if (ctx.Api) return 'api';
    if (ctx.Event) return 'event';
    if (ctx.Stream) return 'stream';
    return 'api';
  }

  externalDefinition(ctx: ExternalDefinitionCstContext): ExternalDefinition {
    const id = ctx.externalId[0].image;
    let name: string | undefined;
    let externalType: string | undefined;

    if (ctx.nameProperty) {
      name = this.visit(ctx.nameProperty[0]);
    }
    if (ctx.externalTypeProperty) {
      externalType = this.visit(ctx.externalTypeProperty[0]);
    }

    return {
      type: 'ExternalDefinition',
      id,
      name,
      externalType,
      attributes: [],
    };
  }

  externalTypeProperty(ctx: ExternalTypePropertyCstContext): string {
    const token = ctx.typeValue[0];
    const value = token.image;
    // Remove quotes if it's a string literal
    if (value.startsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }

  userDefinition(ctx: UserDefinitionCstContext): UserDefinition {
    return {
      type: 'UserDefinition',
      id: ctx.userId[0].image,
      attributes: ctx.attributes ? this.visit(ctx.attributes[0]) : [],
    };
  }

  connection(ctx: ConnectionCstContext): Connection {
    return {
      type: 'Connection',
      source: ctx.source[0].image,
      target: ctx.target[0].image,
      attributes: ctx.attributes ? this.visit(ctx.attributes[0]) : [],
    };
  }

  attributes(ctx: AttributesCstContext): Attribute[] {
    return ctx.attribute.map((attrNode) => this.visit(attrNode));
  }

  attribute(ctx: AttributeCstContext): Attribute {
    const key = ctx.key[0].image;
    let value: string | number | boolean | undefined;

    if (ctx.value) {
      value = this.visit(ctx.value[0]);
    }

    return {
      type: 'Attribute',
      key,
      value,
    };
  }

  value(ctx: ValueCstContext): string | number | boolean {
    if (ctx.StringLiteral) {
      const raw = ctx.StringLiteral[0].image;
      return raw.slice(1, -1); // Remove quotes
    }
    if (ctx.NumberLiteral) {
      const num = ctx.NumberLiteral[0].image;
      return num.includes('.') ? parseFloat(num) : parseInt(num, 10);
    }
    if (ctx.True) {
      return true;
    }
    if (ctx.False) {
      return false;
    }
    if (ctx.identifierValue) {
      return ctx.identifierValue[0].image;
    }
    return '';
  }
}

// ============================================
// Singleton Visitor Instance
// ============================================

export const visitorInstance = new CellDiagramsVisitor();
```

## Task 2.6: Create Main Parse Function

**File: `packages/core/src/parser.ts`**
```typescript
/**
 * Cell Diagrams Parser API
 * 
 * Main entry point for parsing Cell Diagrams DSL source code.
 */

import { CellDiagramsLexer, tokenize } from './grammar/lexer';
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
```

## Task 2.7: Implement Stringify Function

**File: `packages/core/src/stringify.ts`**
```typescript
/**
 * Cell Diagrams Stringify
 * 
 * Converts an AST back to Cell Diagrams DSL source code.
 */

import {
  Program,
  Statement,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  Connection,
  ComponentDefinition,
  InternalConnection,
  EndpointDefinition,
  Attribute,
  COMPONENT_TYPE_REVERSE_MAP,
} from './ast/types';

// ============================================
// Configuration
// ============================================

export interface StringifyOptions {
  /** Indentation string (default: 2 spaces) */
  indent?: string;
  /** Line ending (default: \n) */
  lineEnding?: string;
  /** Add blank lines between top-level statements */
  blankLinesBetweenStatements?: boolean;
}

const defaultOptions: Required<StringifyOptions> = {
  indent: '  ',
  lineEnding: '\n',
  blankLinesBetweenStatements: true,
};

// ============================================
// Main Stringify Function
// ============================================

/**
 * Convert an AST back to Cell Diagrams DSL source code.
 * 
 * @param ast - The AST to stringify
 * @param options - Formatting options
 * @returns The formatted DSL source code
 */
export function stringify(ast: Program, options: StringifyOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  const lines: string[] = [];

  for (let i = 0; i < ast.statements.length; i++) {
    const stmt = ast.statements[i];
    lines.push(stringifyStatement(stmt, opts));

    // Add blank line between statements
    if (opts.blankLinesBetweenStatements && i < ast.statements.length - 1) {
      lines.push('');
    }
  }

  return lines.join(opts.lineEnding).trim() + opts.lineEnding;
}

// ============================================
// Statement Stringifiers
// ============================================

function stringifyStatement(stmt: Statement, opts: Required<StringifyOptions>): string {
  switch (stmt.type) {
    case 'CellDefinition':
      return stringifyCellDefinition(stmt, opts);
    case 'ExternalDefinition':
      return stringifyExternalDefinition(stmt, opts);
    case 'UserDefinition':
      return stringifyUserDefinition(stmt, opts);
    case 'Connection':
      return stringifyConnection(stmt, opts);
    default:
      return '';
  }
}

function stringifyCellDefinition(cell: CellDefinition, opts: Required<StringifyOptions>): string {
  const { indent, lineEnding } = opts;
  const lines: string[] = [];

  lines.push(`cell ${cell.id} {`);

  // Name property
  if (cell.name) {
    lines.push(`${indent}name: "${escapeString(cell.name)}"`);
  }

  // Type property
  if (cell.cellType) {
    lines.push(`${indent}type: ${cell.cellType}`);
  }

  // Components block
  if (cell.components.length > 0) {
    lines.push('');
    lines.push(`${indent}components {`);
    for (const comp of cell.components) {
      lines.push(`${indent}${indent}${stringifyComponent(comp)}`);
    }
    lines.push(`${indent}}`);
  }

  // Connect block
  if (cell.internalConnections.length > 0) {
    lines.push('');
    lines.push(`${indent}connect {`);
    for (const conn of cell.internalConnections) {
      lines.push(`${indent}${indent}${stringifyInternalConnection(conn)}`);
    }
    lines.push(`${indent}}`);
  }

  // Expose block
  if (cell.exposedEndpoints.length > 0) {
    lines.push('');
    lines.push(`${indent}expose {`);
    for (const ep of cell.exposedEndpoints) {
      lines.push(`${indent}${indent}${stringifyEndpoint(ep)}`);
    }
    lines.push(`${indent}}`);
  }

  lines.push('}');

  return lines.join(lineEnding);
}

function stringifyComponent(comp: ComponentDefinition): string {
  const typeShort = COMPONENT_TYPE_REVERSE_MAP[comp.componentType];
  const attrs = stringifyAttributes(comp.attributes);
  return `${typeShort} ${comp.id}${attrs}`;
}

function stringifyInternalConnection(conn: InternalConnection): string {
  const attrs = stringifyAttributes(conn.attributes);
  return `${conn.source} -> ${conn.target}${attrs}`;
}

function stringifyEndpoint(ep: EndpointDefinition): string {
  const attrs = stringifyAttributes(ep.attributes);
  return `${ep.endpointType}: ${ep.componentRef}${attrs}`;
}

function stringifyExternalDefinition(
  ext: ExternalDefinition,
  opts: Required<StringifyOptions>
): string {
  const { indent, lineEnding } = opts;
  const lines: string[] = [];

  lines.push(`external ${ext.id} {`);

  if (ext.name) {
    lines.push(`${indent}name: "${escapeString(ext.name)}"`);
  }

  if (ext.externalType) {
    lines.push(`${indent}type: ${ext.externalType}`);
  }

  lines.push('}');

  return lines.join(lineEnding);
}

function stringifyUserDefinition(user: UserDefinition, _opts: Required<StringifyOptions>): string {
  const attrs = stringifyAttributes(user.attributes);
  return `user ${user.id}${attrs}`;
}

function stringifyConnection(conn: Connection, _opts: Required<StringifyOptions>): string {
  const attrs = stringifyAttributes(conn.attributes);
  return `connect ${conn.source} -> ${conn.target}${attrs}`;
}

// ============================================
// Utility Functions
// ============================================

function stringifyAttributes(attrs: Attribute[]): string {
  if (attrs.length === 0) return '';

  const parts = attrs.map((attr) => {
    if (attr.value === undefined) {
      return attr.key;
    }

    let valueStr: string;
    if (typeof attr.value === 'string') {
      valueStr = `"${escapeString(attr.value)}"`;
    } else {
      valueStr = String(attr.value);
    }

    return `${attr.key}: ${valueStr}`;
  });

  return ` [${parts.join(', ')}]`;
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
```

## Task 2.8: Create Package Entry Point

**File: `packages/core/src/index.ts`**
```typescript
/**
 * @cell-diagrams/core
 * 
 * Parser and AST for Cell Diagrams DSL.
 */

// AST Types
export * from './ast/types';

// Parser
export { parse, parseOrThrow, validate, ParseResult, ParseError } from './parser';

// Stringify
export { stringify, StringifyOptions } from './stringify';

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
```

## Task 2.9: Create Unit Tests

**File: `packages/core/src/__tests__/parser.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { parse, parseOrThrow, validate, stringify } from '../index';

describe('Cell Diagrams Parser', () => {
  describe('parse()', () => {
    it('should parse a simple cell definition', () => {
      const source = `
cell OrderCell {
  name: "Order Management"
  type: logic

  components {
    ms OrderService
    db OrderDB
  }

  connect {
    OrderService -> OrderDB
  }

  expose {
    api: OrderService
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
      expect(result.ast!.statements).toHaveLength(1);

      const cell = result.ast!.statements[0];
      expect(cell.type).toBe('CellDefinition');

      if (cell.type === 'CellDefinition') {
        expect(cell.id).toBe('OrderCell');
        expect(cell.name).toBe('Order Management');
        expect(cell.cellType).toBe('logic');
        expect(cell.components).toHaveLength(2);
        expect(cell.internalConnections).toHaveLength(1);
        expect(cell.exposedEndpoints).toHaveLength(1);
      }
    });

    it('should parse component attributes', () => {
      const source = `
cell TestCell {
  components {
    db MainDB [tech: "PostgreSQL", replicas: 3]
    ms Service [async, readonly: true]
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.components[0].attributes).toHaveLength(2);
        expect(cell.components[0].attributes[0].key).toBe('tech');
        expect(cell.components[0].attributes[0].value).toBe('PostgreSQL');
        expect(cell.components[0].attributes[1].key).toBe('replicas');
        expect(cell.components[0].attributes[1].value).toBe(3);

        expect(cell.components[1].attributes).toHaveLength(2);
        expect(cell.components[1].attributes[0].key).toBe('async');
        expect(cell.components[1].attributes[0].value).toBeUndefined();
        expect(cell.components[1].attributes[1].key).toBe('readonly');
        expect(cell.components[1].attributes[1].value).toBe(true);
      }
    });

    it('should parse external definitions', () => {
      const source = `
external Stripe {
  name: "Stripe Payment Gateway"
  type: saas
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.ast!.statements).toHaveLength(1);

      const ext = result.ast!.statements[0];
      expect(ext.type).toBe('ExternalDefinition');

      if (ext.type === 'ExternalDefinition') {
        expect(ext.id).toBe('Stripe');
        expect(ext.name).toBe('Stripe Payment Gateway');
        expect(ext.externalType).toBe('saas');
      }
    });

    it('should parse user definitions', () => {
      const source = `user Customer [type: external, channel: web]`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const user = result.ast!.statements[0];
      expect(user.type).toBe('UserDefinition');

      if (user.type === 'UserDefinition') {
        expect(user.id).toBe('Customer');
        expect(user.attributes).toHaveLength(2);
      }
    });

    it('should parse inter-cell connections', () => {
      const source = `connect OrderCell -> CustomerCell [via: CustomerGateway, label: "Get Customer"]`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const conn = result.ast!.statements[0];
      expect(conn.type).toBe('Connection');

      if (conn.type === 'Connection') {
        expect(conn.source).toBe('OrderCell');
        expect(conn.target).toBe('CustomerCell');
        expect(conn.attributes).toHaveLength(2);
      }
    });

    it('should handle parse errors gracefully', () => {
      const source = `cell {}`;
      const result = parse(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBeNull();
    });

    it('should handle comments', () => {
      const source = `
// This is a cell definition
cell TestCell {
  /* Multi-line
     comment */
  name: "Test"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
    });
  });

  describe('parseOrThrow()', () => {
    it('should return AST for valid source', () => {
      const ast = parseOrThrow('cell TestCell {}');
      expect(ast.type).toBe('Program');
    });

    it('should throw on invalid source', () => {
      expect(() => parseOrThrow('cell {}')).toThrow('Parse errors');
    });
  });

  describe('validate()', () => {
    it('should return empty array for valid source', () => {
      const errors = validate('cell TestCell {}');
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid source', () => {
      const errors = validate('cell {}');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('stringify()', () => {
    it('should roundtrip through parse and stringify', () => {
      const source = `cell TestCell {
  name: "Test"
  type: logic

  components {
    ms TestService
  }
}
`;
      const ast = parseOrThrow(source);
      const output = stringify(ast);
      const reparsed = parseOrThrow(output);

      expect(reparsed.statements).toHaveLength(1);
      expect(reparsed.statements[0].type).toBe('CellDefinition');
    });

    it('should escape special characters in strings', () => {
      const source = `cell TestCell {
  name: "Test with \\"quotes\\" and\\nnewline"
}
`;
      const ast = parseOrThrow(source);

      const cell = ast.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.name).toBe('Test with "quotes" and\nnewline');
      }
    });
  });
});

describe('All Component Types', () => {
  const componentTypes = [
    ['ms', 'microservice'],
    ['fn', 'function'],
    ['db', 'database'],
    ['gw', 'gateway'],
    ['svc', 'service'],
    ['broker', 'broker'],
    ['cache', 'cache'],
    ['legacy', 'legacy'],
    ['esb', 'esb'],
    ['idp', 'idp'],
  ] as const;

  it.each(componentTypes)('should parse %s as %s', (short, full) => {
    const source = `cell TestCell { components { ${short} TestComp } }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.components[0].componentType).toBe(full);
    }
  });
});

describe('All Cell Types', () => {
  const cellTypes = ['logic', 'integration', 'legacy', 'data', 'security', 'channel'];

  it.each(cellTypes)('should parse cell type %s', (cellType) => {
    const source = `cell TestCell { type: ${cellType} }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.cellType).toBe(cellType);
    }
  });
});

describe('All Endpoint Types', () => {
  const endpointTypes = ['api', 'event', 'stream'];

  it.each(endpointTypes)('should parse endpoint type %s', (epType) => {
    const source = `cell TestCell { components { gw TestGw } expose { ${epType}: TestGw } }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.exposedEndpoints[0].endpointType).toBe(epType);
    }
  });
});
```

### ✅ Phase 2 Verification

```bash
cd packages/core
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

---

# PHASE 3: RENDERER PACKAGE

(Continue with @cell-diagrams/renderer implementation using React Flow...)

---

# PHASE 4: WEB APPLICATION

(Continue with apps/web implementation using Vite + React + Monaco...)

---

# PHASE 5: VS CODE EXTENSION

(Continue with extensions/vscode implementation...)

---

# PHASE 6: COLLABORATION (P3)

(Continue with Yjs + Hocuspocus implementation...)

---

## Implementation Checklist

### Phase 1: Monorepo Setup
- [ ] Create directory structure
- [ ] Configure pnpm workspace
- [ ] Configure Turborepo
- [ ] Set up shared TypeScript config
- [ ] Set up Prettier
- [ ] Create .gitignore

### Phase 2: Core Package
- [ ] Define AST types
- [ ] Implement Chevrotain lexer
- [ ] Implement Chevrotain parser
- [ ] Implement CST to AST visitor
- [ ] Implement stringify function
- [ ] Create package entry point
- [ ] Write unit tests
- [ ] Verify build and tests pass

### Phase 3: Renderer Package
- [ ] Set up React Flow
- [ ] Create CellNode component
- [ ] Create ExternalNode component
- [ ] Create UserNode component
- [ ] Implement AST to diagram converter
- [ ] Implement diagram to AST converter
- [ ] Create CSS styles
- [ ] Integrate Dagre layout

### Phase 4: Web Application
- [ ] Set up Vite + React
- [ ] Integrate Monaco editor
- [ ] Set up Monaco language configuration
- [ ] Create split pane layout
- [ ] Implement live preview
- [ ] Add syntax highlighting
- [ ] Add error markers
- [ ] Implement URL sharing

### Phase 5: VS Code Extension
- [ ] Create TextMate grammar
- [ ] Set up Language Server
- [ ] Implement diagnostics
- [ ] Implement completions
- [ ] Create preview webview
- [ ] Package extension

### Phase 6: Collaboration (Future)
- [ ] Set up Hocuspocus server
- [ ] Implement Yjs integration
- [ ] Add awareness (cursors)
- [ ] Implement VS Code collab

---

## Example Cell Diagrams DSL

```cell
// E-Commerce Cell Architecture Example

cell OrderCell {
  name: "Order Management"
  type: logic

  components {
    ms OrderService
    ms CartService
    fn OrderValidator
    db OrderDB [tech: "PostgreSQL"]
    gw OrderGateway
    broker OrderEvents [tech: "Kafka"]
  }

  connect {
    OrderGateway -> OrderService
    OrderService -> OrderDB
    OrderService -> CartService
    OrderValidator -> OrderService
    OrderService -> OrderEvents
  }

  expose {
    api: OrderGateway [path: "/api/orders"]
    event: OrderEvents [topic: "orders.*"]
  }
}

cell CustomerCell {
  name: "Customer Management"
  type: logic

  components {
    ms CustomerService
    db CustomerDB
    gw CustomerGateway
  }

  expose {
    api: CustomerGateway
  }
}

external Stripe {
  name: "Stripe Payment"
  type: saas
}

user Customer [type: external, channel: web]
user Admin [type: internal]

connect OrderCell -> CustomerCell [via: CustomerGateway, label: "Get Customer"]
connect OrderCell -> Stripe [label: "Process Payment"]
connect Customer -> OrderCell [via: OrderGateway]
```

---

## Quick Reference Commands

```bash
# === Project Setup ===
pnpm install                    # Install all dependencies
pnpm build                      # Build all packages
pnpm dev                        # Start development mode

# === Individual Packages ===
pnpm --filter @cell-diagrams/core build
pnpm --filter @cell-diagrams/core test
pnpm --filter @cell-diagrams/core dev

pnpm --filter @cell-diagrams/renderer build
pnpm --filter @cell-diagrams/web dev

# === Testing ===
pnpm test                       # Run all tests
pnpm --filter @cell-diagrams/core test:watch

# === Type Checking ===
pnpm typecheck                  # Type check all packages

# === Cleaning ===
pnpm clean                      # Clean all build artifacts
```

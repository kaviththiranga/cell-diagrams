# CellDSL - Improved Implementation Plan

## Executive Summary

A comprehensive toolkit for creating Cell-Based Architecture diagrams using a custom DSL. The project consists of multiple packages in a monorepo architecture, enabling code reuse across:
- **Web Application** (standalone diagram editor)
- **VS Code Extension** (with syntax highlighting, autocomplete, and live preview)
- **CLI Tool** (for CI/CD integration)
- **Embeddable Widget** (for blogs/documentation)

---

## Part 1: Monorepo Architecture

### 1.1 Technology Stack for Monorepo

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **pnpm** | Package manager | Faster than npm/yarn, efficient disk usage via hard links, excellent workspace support |
| **Turborepo** | Build orchestration | Fast incremental builds, intelligent caching, task pipelines, simpler than Nx |
| **TypeScript** | Language | Type safety across all packages, better IDE support, shared types |
| **Vitest** | Testing | Fast, Vite-native, works well with TypeScript |
| **tsup** | Bundling | Zero-config TypeScript bundler, ESM/CJS/IIFE outputs |
| **Changesets** | Versioning | Automated changelog and versioning for publishable packages |

### 1.2 Monorepo Structure

```
celldsl/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test, lint, build on PR
│       ├── release.yml               # Publish packages on release
│       └── deploy-web.yml            # Deploy web app
├── apps/
│   ├── web/                          # Main web application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── main.ts
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── embed/                        # Lightweight embeddable viewer
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── docs/                         # Documentation site (VitePress/Astro)
│       ├── src/
│       └── package.json
├── packages/
│   ├── core/                         # Core parsing and AST (shared)
│   │   ├── src/
│   │   │   ├── grammar/
│   │   │   │   ├── lexer.ts          # Chevrotain lexer
│   │   │   │   ├── parser.ts         # Chevrotain parser
│   │   │   │   └── visitor.ts        # AST visitor
│   │   │   ├── ast/
│   │   │   │   ├── types.ts          # AST node types
│   │   │   │   └── builder.ts        # AST builder
│   │   │   ├── validator/
│   │   │   │   └── validator.ts      # Semantic validation
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── renderer/                     # SVG rendering engine (shared)
│   │   ├── src/
│   │   │   ├── layout/
│   │   │   │   ├── dagre-layout.ts   # Graph layout using Dagre
│   │   │   │   └── manual-layout.ts  # Manual positioning
│   │   │   ├── shapes/
│   │   │   │   ├── cell.ts           # Octagon cell shape
│   │   │   │   ├── component.ts      # Component shapes
│   │   │   │   ├── connection.ts     # Connection lines
│   │   │   │   └── user.ts           # User/actor shapes
│   │   │   ├── themes/
│   │   │   │   ├── dark.ts
│   │   │   │   ├── light.ts
│   │   │   │   └── types.ts
│   │   │   ├── renderer.ts           # Main renderer
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── editor-support/               # Editor integration (shared)
│   │   ├── src/
│   │   │   ├── monaco/
│   │   │   │   ├── language.ts       # Monaco language definition
│   │   │   │   ├── completion.ts     # Autocomplete provider
│   │   │   │   ├── hover.ts          # Hover information
│   │   │   │   ├── diagnostics.ts    # Error markers
│   │   │   │   └── theme.ts          # Editor theme
│   │   │   ├── codemirror/           # Alternative for lightweight embed
│   │   │   │   ├── language.ts
│   │   │   │   └── extensions.ts
│   │   │   ├── textmate/
│   │   │   │   └── celldsl.tmLanguage.json
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── language-server/              # LSP server (for VS Code + other editors)
│   │   ├── src/
│   │   │   ├── server.ts             # Main LSP server
│   │   │   ├── capabilities/
│   │   │   │   ├── completion.ts
│   │   │   │   ├── diagnostics.ts
│   │   │   │   ├── hover.ts
│   │   │   │   ├── definition.ts
│   │   │   │   └── formatting.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── sharing/                      # URL encoding, Gist integration
│   │   ├── src/
│   │   │   ├── encoder.ts            # Base64 + compression
│   │   │   ├── gist.ts               # GitHub Gist API
│   │   │   ├── embed.ts              # Embed code generator
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                          # Command-line tool
│       ├── src/
│       │   ├── commands/
│       │   │   ├── render.ts         # celldsl render input.cell -o output.svg
│       │   │   ├── validate.ts       # celldsl validate input.cell
│       │   │   └── format.ts         # celldsl format input.cell
│       │   └── index.ts
│       ├── bin/
│       │   └── celldsl.js
│       ├── package.json
│       └── tsconfig.json
├── extensions/
│   └── vscode/                       # VS Code extension
│       ├── src/
│       │   ├── extension.ts          # Extension entry point
│       │   ├── preview/
│       │   │   ├── preview-panel.ts  # Webview preview panel
│       │   │   └── preview.html
│       │   └── client.ts             # LSP client
│       ├── syntaxes/
│       │   └── celldsl.tmLanguage.json
│       ├── language-configuration.json
│       ├── package.json              # VS Code extension manifest
│       ├── tsconfig.json
│       └── webpack.config.js
├── examples/
│   ├── e-commerce.cell
│   ├── microservices.cell
│   └── order-management.cell
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace configuration
├── package.json                      # Root package.json
├── tsconfig.base.json                # Shared TypeScript config
└── README.md
```

### 1.3 Package Dependencies Graph

```
                    ┌─────────────────────────────────────────────┐
                    │                  apps/web                    │
                    │         (Main web application)               │
                    └─────────────────────────────────────────────┘
                         │              │              │
                         ▼              ▼              ▼
┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│   @celldsl/ │   │   @celldsl/ │   │   @celldsl/  │   │   @celldsl/  │
│    core     │◄──│  renderer   │   │editor-support│   │   sharing    │
└─────────────┘   └─────────────┘   └──────────────┘   └──────────────┘
       ▲                 ▲                  │
       │                 │                  │
       │                 │                  ▼
       │           ┌─────┴─────────────────────┐
       │           │     @celldsl/             │
       └───────────│   language-server         │
                   └───────────────────────────┘
                              ▲
                              │
                   ┌──────────┴──────────┐
                   │  extensions/vscode   │
                   │  (VS Code Extension) │
                   └─────────────────────┘
```

### 1.4 Configuration Files

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'extensions/*'
```

#### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "isolatedModules": true
  }
}
```

---

## Part 2: Parser/Grammar Library Comparison

### 2.1 Detailed Comparison

| Library | Type | Performance | Error Recovery | Learning Curve | TypeScript | Best For |
|---------|------|-------------|----------------|----------------|------------|----------|
| **Chevrotain** | DSL (runtime) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Native | Production DSLs |
| **Peggy** | PEG (generated) | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Via plugin | Simple grammars |
| **ANTLR4** | LL(*) (generated) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Via target | Complex languages |
| **Nearley** | Earley (generated) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Via types | Ambiguous grammars |
| **Ohm-js** | PEG (runtime) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Via types | Prototyping |
| **Moo + Custom** | Lexer only | ⭐⭐⭐⭐⭐ | Manual | ⭐⭐⭐ | Via types | With other parsers |

### 2.2 Recommendation: **Chevrotain**

**Why Chevrotain for CellDSL:**

1. **Performance**: Fastest JavaScript parser, important for real-time preview
2. **Fault Tolerance**: Built-in error recovery means partial parsing works (crucial for IDE features)
3. **TypeScript Native**: Written in TypeScript, excellent type inference
4. **No Build Step**: Grammar defined in code, no code generation needed
5. **IDE Features**: Easy to extract token positions for syntax highlighting
6. **Active Maintenance**: Well-maintained, used by major projects (Langium, VS Code)
7. **Reusable Lexer**: Same lexer can power both parser and syntax highlighting

**Example Chevrotain Parser Structure:**
```typescript
// packages/core/src/grammar/lexer.ts
import { createToken, Lexer } from 'chevrotain';

// Tokens
export const Cell = createToken({ name: 'Cell', pattern: /cell/ });
export const External = createToken({ name: 'External', pattern: /external/ });
export const User = createToken({ name: 'User', pattern: /user/ });
export const Connect = createToken({ name: 'Connect', pattern: /connect/ });
export const Components = createToken({ name: 'Components', pattern: /components/ });
export const Expose = createToken({ name: 'Expose', pattern: /expose/ });
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_]\w*/ });
export const StringLiteral = createToken({ name: 'StringLiteral', pattern: /"[^"]*"/ });
export const LBrace = createToken({ name: 'LBrace', pattern: /{/ });
export const RBrace = createToken({ name: 'RBrace', pattern: /}/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /]/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /->/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /\s+/, group: Lexer.SKIPPED });
export const Comment = createToken({ name: 'Comment', pattern: /\/\/[^\n]*/, group: Lexer.SKIPPED });

export const allTokens = [
  WhiteSpace, Comment,
  Cell, External, User, Connect, Components, Expose,
  Arrow, LBrace, RBrace, LBracket, RBracket, Colon, Comma,
  StringLiteral, Identifier
];

export const CellDSLLexer = new Lexer(allTokens);
```

```typescript
// packages/core/src/grammar/parser.ts
import { CstParser } from 'chevrotain';
import { allTokens, Cell, Identifier, LBrace, RBrace, ... } from './lexer';

export class CellDSLParser extends CstParser {
  constructor() {
    super(allTokens, { recoveryEnabled: true });
    this.performSelfAnalysis();
  }

  public program = this.RULE('program', () => {
    this.MANY(() => this.SUBRULE(this.statement));
  });

  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.cellDefinition) },
      { ALT: () => this.SUBRULE(this.externalDefinition) },
      { ALT: () => this.SUBRULE(this.userDefinition) },
      { ALT: () => this.SUBRULE(this.connection) },
    ]);
  });

  private cellDefinition = this.RULE('cellDefinition', () => {
    this.CONSUME(Cell);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.MANY(() => this.SUBRULE(this.cellBody));
    this.CONSUME(RBrace);
  });

  // ... more rules
}
```

### 2.3 Alternative: Peggy (Simpler but Less Powerful)

If you prefer a grammar file approach:

```peggy
// celldsl.peggy
Program = statements:Statement* { return { type: 'Program', statements }; }

Statement = CellDef / ExternalDef / UserDef / Connection

CellDef = "cell" _ id:Identifier _ "{" _ body:CellBody* _ "}" {
  return { type: 'Cell', id, body };
}

CellBody = NameProp / TypeProp / ComponentsBlock / ConnectBlock / ExposeBlock

Identifier = $([a-zA-Z_][a-zA-Z0-9_]*)
_ = [ \t\n\r]*
```

---

## Part 3: Editor Choice - Monaco vs CodeMirror

### 3.1 Detailed Comparison

| Feature | Monaco Editor | CodeMirror 6 |
|---------|--------------|--------------|
| **Bundle Size** | ~5-10MB | ~300KB core |
| **VS Code Parity** | ✅ Identical | ❌ Different API |
| **Mobile Support** | ❌ Poor | ✅ Excellent |
| **Custom Language** | ✅ Monarch + LSP | ✅ Lezer + Extensions |
| **Performance** | ✅ Large files | ✅ Very fast |
| **Customization** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Learning Curve** | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Code Reuse w/VSCode** | ✅ High | ❌ None |

### 3.2 Recommendation: **Hybrid Approach**

| Use Case | Editor | Rationale |
|----------|--------|-----------|
| **Web App (Main)** | Monaco | VS Code familiarity, full features |
| **Embed Widget** | CodeMirror 6 | Lightweight, mobile-friendly |
| **VS Code Extension** | Native + LSP | Uses VS Code's built-in editor |

### 3.3 Monaco Integration

```typescript
// packages/editor-support/src/monaco/language.ts
import * as monaco from 'monaco-editor';

export const LANGUAGE_ID = 'celldsl';

// Monarch tokenizer (syntax highlighting)
export const monarchLanguage: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/\/\/.*$/, 'comment'],
      [/"[^"]*"/, 'string'],
      [/\b(cell|external|user|connect|components|expose)\b/, 'keyword'],
      [/\b(ms|fn|db|gw|svc|broker|cache|legacy|esb|idp)\b/, 'type'],
      [/\b(api|event|stream)\b/, 'type.identifier'],
      [/\b(logic|integration|legacy|data|security|channel|external)\b/, 'constant'],
      [/->/, 'operator'],
      [/[a-zA-Z_]\w*/, 'identifier'],
      [/[{}[\]:,]/, 'delimiter'],
    ],
  },
};

// Language configuration (brackets, comments, etc.)
export const languageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: { lineComment: '//' },
  brackets: [['{', '}'], ['[', ']']],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
  ],
};

// Register language
export function registerCellDSLLanguage() {
  monaco.languages.register({ id: LANGUAGE_ID, extensions: ['.cell'] });
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchLanguage);
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration);
}
```

### 3.4 Completion Provider

```typescript
// packages/editor-support/src/monaco/completion.ts
import * as monaco from 'monaco-editor';
import { LANGUAGE_ID } from './language';

const keywords = [
  { label: 'cell', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'cell ${1:CellName} {\n\tname: "${2:Display Name}"\n\ttype: ${3|logic,integration,legacy,data,security,channel,external|}\n\t\n\tcomponents {\n\t\t$0\n\t}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
  { label: 'external', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'external ${1:Name} {\n\tname: "${2:Display Name}"\n\ttype: ${3|saas,partner|}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
  { label: 'connect', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'connect ${1:Source} -> ${2:Target}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
];

const componentTypes = [
  { label: 'ms', detail: 'Microservice', kind: monaco.languages.CompletionItemKind.TypeParameter },
  { label: 'fn', detail: 'Serverless Function', kind: monaco.languages.CompletionItemKind.TypeParameter },
  { label: 'db', detail: 'Database', kind: monaco.languages.CompletionItemKind.TypeParameter },
  { label: 'gw', detail: 'Gateway', kind: monaco.languages.CompletionItemKind.TypeParameter },
  { label: 'broker', detail: 'Message Broker', kind: monaco.languages.CompletionItemKind.TypeParameter },
  { label: 'cache', detail: 'Cache', kind: monaco.languages.CompletionItemKind.TypeParameter },
];

export function registerCompletionProvider() {
  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [...keywords, ...componentTypes].map(item => ({
          ...item,
          range,
        })),
      };
    },
  });
}
```

---

## Part 4: VS Code Extension Architecture

### 4.1 Extension Structure

```
extensions/vscode/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── client.ts                 # Language Client (connects to LSP)
│   ├── preview/
│   │   ├── preview-panel.ts      # Webview panel for diagram preview
│   │   ├── preview-provider.ts   # Custom editor provider (optional)
│   │   └── webview/
│   │       ├── index.html
│   │       ├── preview.ts        # Preview script (uses @celldsl/renderer)
│   │       └── styles.css
│   └── commands/
│       ├── export-svg.ts
│       └── export-png.ts
├── syntaxes/
│   └── celldsl.tmLanguage.json   # TextMate grammar for syntax highlighting
├── themes/
│   └── celldsl-color-theme.json  # Optional custom theme
├── language-configuration.json    # Bracket matching, comments, etc.
├── package.json                   # Extension manifest
├── tsconfig.json
├── webpack.config.js              # Bundle extension
└── README.md
```

### 4.2 Extension Manifest (`package.json`)

```json
{
  "name": "celldsl-vscode",
  "displayName": "CellDSL - Cell-Based Architecture Diagrams",
  "description": "Language support and preview for Cell-Based Architecture diagrams",
  "version": "0.1.0",
  "publisher": "celldsl",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Programming Languages", "Visualization"],
  "activationEvents": ["onLanguage:celldsl"],
  "main": "./dist/extension.js",
  "contributes": {
    "languages": [{
      "id": "celldsl",
      "aliases": ["CellDSL", "Cell Architecture"],
      "extensions": [".cell"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "celldsl",
      "scopeName": "source.celldsl",
      "path": "./syntaxes/celldsl.tmLanguage.json"
    }],
    "commands": [
      {
        "command": "celldsl.showPreview",
        "title": "CellDSL: Show Diagram Preview",
        "icon": "$(preview)"
      },
      {
        "command": "celldsl.exportSVG",
        "title": "CellDSL: Export as SVG"
      },
      {
        "command": "celldsl.exportPNG",
        "title": "CellDSL: Export as PNG"
      }
    ],
    "menus": {
      "editor/title": [{
        "when": "resourceLangId == celldsl",
        "command": "celldsl.showPreview",
        "group": "navigation"
      }]
    },
    "keybindings": [{
      "command": "celldsl.showPreview",
      "key": "ctrl+shift+v",
      "mac": "cmd+shift+v",
      "when": "resourceLangId == celldsl"
    }],
    "configuration": {
      "title": "CellDSL",
      "properties": {
        "celldsl.preview.theme": {
          "type": "string",
          "enum": ["dark", "light", "auto"],
          "default": "auto",
          "description": "Diagram preview theme"
        },
        "celldsl.preview.autoRefresh": {
          "type": "boolean",
          "default": true,
          "description": "Automatically refresh preview on save"
        }
      }
    }
  },
  "dependencies": {
    "@celldsl/core": "workspace:*",
    "@celldsl/renderer": "workspace:*",
    "@celldsl/language-server": "workspace:*",
    "vscode-languageclient": "^9.0.0"
  }
}
```

### 4.3 TextMate Grammar (`celldsl.tmLanguage.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "CellDSL",
  "scopeName": "source.celldsl",
  "patterns": [
    { "include": "#comments" },
    { "include": "#strings" },
    { "include": "#keywords" },
    { "include": "#types" },
    { "include": "#operators" },
    { "include": "#identifiers" }
  ],
  "repository": {
    "comments": {
      "patterns": [{
        "name": "comment.line.double-slash.celldsl",
        "match": "//.*$"
      }]
    },
    "strings": {
      "patterns": [{
        "name": "string.quoted.double.celldsl",
        "begin": "\"",
        "end": "\"",
        "patterns": [{
          "name": "constant.character.escape.celldsl",
          "match": "\\\\."
        }]
      }]
    },
    "keywords": {
      "patterns": [{
        "name": "keyword.control.celldsl",
        "match": "\\b(cell|external|user|connect|components|expose|name|type|via|label)\\b"
      }]
    },
    "types": {
      "patterns": [
        {
          "name": "entity.name.type.component.celldsl",
          "match": "\\b(ms|fn|db|gw|svc|broker|cache|legacy|esb|idp)\\b"
        },
        {
          "name": "entity.name.type.cell.celldsl",
          "match": "\\b(logic|integration|legacy|data|security|channel|external)\\b"
        },
        {
          "name": "entity.name.type.endpoint.celldsl",
          "match": "\\b(api|event|stream)\\b"
        }
      ]
    },
    "operators": {
      "patterns": [{
        "name": "keyword.operator.arrow.celldsl",
        "match": "->"
      }]
    },
    "identifiers": {
      "patterns": [{
        "name": "variable.other.celldsl",
        "match": "\\b[a-zA-Z_][a-zA-Z0-9_]*\\b"
      }]
    }
  }
}
```

### 4.4 Language Server Implementation

```typescript
// packages/language-server/src/server.ts
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CellDSLParser, CellDSLLexer } from '@celldsl/core';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const parser = new CellDSLParser();

connection.onInitialize((params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { triggerCharacters: ['.', ':', ' '] },
      hoverProvider: true,
      definitionProvider: true,
      documentFormattingProvider: true,
      diagnosticProvider: { interFileDependencies: false, workspaceDiagnostics: false },
    },
  };
});

// Validate document on change
documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

async function validateDocument(document: TextDocument): Promise<void> {
  const text = document.getText();
  const diagnostics: Diagnostic[] = [];

  // Lex
  const lexResult = CellDSLLexer.tokenize(text);
  for (const error of lexResult.errors) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: document.positionAt(error.offset),
        end: document.positionAt(error.offset + error.length),
      },
      message: error.message,
      source: 'celldsl',
    });
  }

  // Parse
  parser.input = lexResult.tokens;
  parser.program();
  for (const error of parser.errors) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: document.positionAt(error.token.startOffset || 0),
        end: document.positionAt(error.token.endOffset || 0),
      },
      message: error.message,
      source: 'celldsl',
    });
  }

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

// Completions
connection.onCompletion((_params): CompletionItem[] => {
  return [
    { label: 'cell', kind: CompletionItemKind.Keyword, detail: 'Define a new cell' },
    { label: 'external', kind: CompletionItemKind.Keyword, detail: 'Define external system' },
    { label: 'connect', kind: CompletionItemKind.Keyword, detail: 'Connect cells' },
    { label: 'ms', kind: CompletionItemKind.TypeParameter, detail: 'Microservice component' },
    { label: 'fn', kind: CompletionItemKind.TypeParameter, detail: 'Function component' },
    { label: 'db', kind: CompletionItemKind.TypeParameter, detail: 'Database component' },
    { label: 'gw', kind: CompletionItemKind.TypeParameter, detail: 'Gateway component' },
  ];
});

documents.listen(connection);
connection.listen();
```

### 4.5 Preview Panel (Webview)

```typescript
// extensions/vscode/src/preview/preview-panel.ts
import * as vscode from 'vscode';
import { parse } from '@celldsl/core';
import { render } from '@celldsl/renderer';

export class CellDSLPreviewPanel {
  public static currentPanel: CellDSLPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
    const column = vscode.ViewColumn.Beside;

    if (CellDSLPreviewPanel.currentPanel) {
      CellDSLPreviewPanel.currentPanel._panel.reveal(column);
      CellDSLPreviewPanel.currentPanel.update(document);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'celldslPreview',
      'CellDSL Preview',
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      }
    );

    CellDSLPreviewPanel.currentPanel = new CellDSLPreviewPanel(panel, extensionUri);
    CellDSLPreviewPanel.currentPanel.update(document);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getHtmlForWebview(extensionUri);
  }

  public update(document: vscode.TextDocument) {
    try {
      const ast = parse(document.getText());
      const svg = render(ast);
      this._panel.webview.postMessage({ type: 'update', svg });
    } catch (error) {
      this._panel.webview.postMessage({ type: 'error', message: String(error) });
    }
  }

  private _getHtmlForWebview(extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 16px; background: var(--vscode-editor-background); }
        #diagram { width: 100%; height: 100vh; }
        #error { color: var(--vscode-errorForeground); padding: 16px; }
      </style>
    </head>
    <body>
      <div id="diagram"></div>
      <div id="error" style="display:none"></div>
      <script>
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', event => {
          const { type, svg, message } = event.data;
          if (type === 'update') {
            document.getElementById('diagram').innerHTML = svg;
            document.getElementById('error').style.display = 'none';
          } else if (type === 'error') {
            document.getElementById('error').textContent = message;
            document.getElementById('error').style.display = 'block';
          }
        });
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    CellDSLPreviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
```

---

## Part 5: Implementation Phases (Revised)

### Phase 1: Foundation (Week 1)
- [ ] Set up monorepo with pnpm + Turborepo
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Implement `@celldsl/core` with Chevrotain parser
- [ ] Define AST types
- [ ] Basic unit tests

### Phase 2: Renderer (Week 2)
- [ ] Implement `@celldsl/renderer` with SVG output
- [ ] Integrate Dagre.js for layout
- [ ] Cell shapes (octagon)
- [ ] Component shapes
- [ ] Connection routing
- [ ] Theme system (dark/light)

### Phase 3: Web Application (Week 3)
- [ ] Set up `apps/web` with Vite
- [ ] Integrate Monaco editor with `@celldsl/editor-support`
- [ ] Live preview panel
- [ ] Error highlighting
- [ ] Basic autocomplete

### Phase 4: VS Code Extension (Week 4)
- [ ] Create `extensions/vscode` structure
- [ ] TextMate grammar for syntax highlighting
- [ ] Implement `@celldsl/language-server`
- [ ] Preview panel with webview
- [ ] Export commands (SVG/PNG)

### Phase 5: Sharing & Distribution (Week 5)
- [ ] URL encoding in `@celldsl/sharing`
- [ ] GitHub Gist integration
- [ ] Embed widget (`apps/embed`)
- [ ] `@celldsl/cli` for CI/CD
- [ ] Publish VS Code extension to marketplace
- [ ] Publish npm packages

### Phase 6: Polish (Week 6)
- [ ] Documentation site (`apps/docs`)
- [ ] Example gallery
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness (embed widget)

---

## Part 6: Code Sharing Strategy

### 6.1 Shared Code Between Web and VS Code

| Package | Web App | VS Code Extension | CLI |
|---------|---------|-------------------|-----|
| `@celldsl/core` | ✅ | ✅ | ✅ |
| `@celldsl/renderer` | ✅ | ✅ (webview) | ✅ |
| `@celldsl/editor-support` | ✅ (Monaco) | ❌ (uses TextMate) | ❌ |
| `@celldsl/language-server` | ❌ | ✅ | ❌ |
| `@celldsl/sharing` | ✅ | ❌ | ❌ |

### 6.2 Bundle Considerations

**Web App:**
- Full Monaco editor (~3MB)
- All packages bundled with Vite
- Tree-shaking enabled

**VS Code Extension:**
- Language server runs as separate process
- Webview bundles renderer separately
- Uses VS Code's built-in editor

**Embed Widget:**
- CodeMirror 6 (~300KB)
- Minimal renderer
- Optimized for size

---

## Part 7: Commands Reference

```bash
# Development
pnpm install                    # Install all dependencies
pnpm dev                        # Start all apps in dev mode
pnpm dev --filter=web           # Start only web app
pnpm dev --filter=vscode        # Start VS Code extension dev

# Building
pnpm build                      # Build all packages
pnpm build --filter=@celldsl/*  # Build only packages
pnpm build --filter=web         # Build only web app

# Testing
pnpm test                       # Run all tests
pnpm test --filter=@celldsl/core # Test specific package

# Linting
pnpm lint                       # Lint all packages
pnpm lint:fix                   # Fix lint issues

# VS Code Extension
cd extensions/vscode
pnpm package                    # Create .vsix package
pnpm publish                    # Publish to marketplace

# CLI
pnpm --filter=@celldsl/cli build
celldsl render diagram.cell -o output.svg
celldsl validate diagram.cell
```

---

## Part 8: Summary of Recommendations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monorepo Tool** | pnpm + Turborepo | Fast, efficient, good DX |
| **Parser Library** | Chevrotain | Performance, error recovery, TypeScript |
| **Web Editor** | Monaco | VS Code parity, full features |
| **Embed Editor** | CodeMirror 6 | Lightweight, mobile-friendly |
| **VS Code Integration** | LSP + TextMate | Standard approach, reusable server |
| **Bundler** | Vite (apps), tsup (packages) | Fast, modern, ESM-first |
| **Testing** | Vitest | Fast, Vite-native |

---

## Quick Start for Claude Code

```bash
# Initialize the monorepo
mkdir celldsl && cd celldsl
pnpm init
pnpm add -D turbo typescript @types/node

# Create workspace structure
mkdir -p apps/web packages/{core,renderer,editor-support,language-server,sharing,cli} extensions/vscode

# Initialize Turborepo
echo '{"packages":["apps/*","packages/*","extensions/*"]}' > pnpm-workspace.yaml
npx turbo init

# Start with core package
cd packages/core
pnpm init
pnpm add chevrotain
pnpm add -D typescript vitest @types/node
```

This plan provides a solid foundation for building a professional-grade CellDSL toolkit with maximum code reuse across platforms.

---

## Part 9: Diagram Rendering Architecture

### 9.1 Rendering Options Comparison

| Library | Rendering | HTML Overlay | Collaboration | Custom Shapes | License | Best For |
|---------|-----------|--------------|---------------|---------------|---------|----------|
| **React Flow** | SVG + HTML | ✅ Native | Yjs integration | ✅ React components | MIT | Node-based editors |
| **tldraw SDK** | Canvas | ✅ React components | Built-in sync | ✅ Full control | Commercial* | Whiteboard-style |
| **JointJS** | SVG | ✅ HTML in foreignObject | Manual | ✅ SVG-based | MIT / Commercial | Complex diagrams |
| **GoJS** | Canvas | ⚠️ Limited | Manual | ✅ Template-based | Commercial | Enterprise diagrams |
| **Plain SVG + D3** | SVG | ✅ Manual | Manual | ✅ Full control | N/A | Full control |
| **Konva** | Canvas | ⚠️ Overlay only | Manual | ✅ Full control | MIT | Graphics-heavy |

*tldraw SDK 4.0 requires commercial license for production

### 9.2 Recommendation: **React Flow** (Primary) + **tldraw** (Alternative)

**Why React Flow for CellDSL:**

1. **Native HTML/React Support**: Custom nodes are just React components—you can embed forms, inputs, dropdowns, anything
2. **SVG-based**: Easy to style with CSS, accessible, debuggable in DevTools
3. **Yjs Integration**: Official collaborative example, proven pattern
4. **MIT Licensed**: No commercial restrictions
5. **Excellent Ecosystem**: Well-documented, active community
6. **Handle System**: Built-in connection points (perfect for cell gateways)

**When to Consider tldraw:**
- If you need free-form drawing alongside diagrams
- If you want built-in collaboration without managing Yjs yourself
- If you're okay with their commercial license terms

### 9.3 React Flow Architecture for CellDSL

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Flow Canvas                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CellNode (Custom Node)                      │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │  <Handle type="target" position="left" />           ││    │
│  │  │                                                      ││    │
│  │  │  ┌──────────────────────────────────────────────┐   ││    │
│  │  │  │         Octagon SVG Background               │   ││    │
│  │  │  │                                              │   ││    │
│  │  │  │  ┌────────────────────────────────────────┐ │   ││    │
│  │  │  │  │     HTML Overlay (foreignObject)       │ │   ││    │
│  │  │  │  │  ┌──────────────────────────────────┐  │ │   ││    │
│  │  │  │  │  │  Cell Name (editable input)      │  │ │   ││    │
│  │  │  │  │  │  Type Badge (dropdown)           │  │ │   ││    │
│  │  │  │  │  │  Components List (nested nodes)  │  │ │   ││    │
│  │  │  │  │  │  Add Component Button            │  │ │   ││    │
│  │  │  │  │  └──────────────────────────────────┘  │ │   ││    │
│  │  │  │  └────────────────────────────────────────┘ │   ││    │
│  │  │  └──────────────────────────────────────────────┘   ││    │
│  │  │                                                      ││    │
│  │  │  <Handle type="source" position="right" />          ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  ComponentNode  │───▶│  ComponentNode  │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Custom Node Implementation

```typescript
// packages/renderer/src/react-flow/nodes/CellNode.tsx
import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CellNodeData } from '../types';

const CellNode = memo(({ id, data, selected }: NodeProps<CellNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Update via Yjs or local state
    data.onNameChange?.(id, e.target.value);
  }, [id, data]);

  return (
    <div className={`cell-node cell-type-${data.type} ${selected ? 'selected' : ''}`}>
      {/* Octagon background via CSS clip-path or SVG */}
      <svg className="cell-background" viewBox="0 0 200 160">
        <path d={octagonPath(200, 160)} fill="currentColor" />
      </svg>
      
      {/* HTML Overlay for interactive content */}
      <div className="cell-content">
        {/* Editable name */}
        {isEditing ? (
          <input
            className="cell-name-input"
            value={data.name}
            onChange={handleNameChange}
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <h3 
            className="cell-name" 
            onDoubleClick={() => setIsEditing(true)}
          >
            {data.name}
          </h3>
        )}
        
        {/* Type selector */}
        <select 
          className="cell-type-select"
          value={data.type}
          onChange={(e) => data.onTypeChange?.(id, e.target.value)}
        >
          <option value="logic">Logic</option>
          <option value="integration">Integration</option>
          <option value="data">Data</option>
          {/* ... more types */}
        </select>
        
        {/* Nested components */}
        <div className="cell-components">
          {data.components.map(comp => (
            <ComponentChip 
              key={comp.id} 
              component={comp}
              onEdit={() => data.onEditComponent?.(comp.id)}
            />
          ))}
          <button 
            className="add-component-btn"
            onClick={() => data.onAddComponent?.(id)}
          >
            + Add Component
          </button>
        </div>
      </div>
      
      {/* Connection handles - positioned at gateway points */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="west"
        className="cell-handle westbound"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="east"
        className="cell-handle eastbound"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="north"
        className="cell-handle northbound"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="south"
        className="cell-handle southbound"
      />
    </div>
  );
});

export default CellNode;
```

### 9.5 Styling with CSS (Octagon Shape)

```css
/* packages/renderer/src/styles/cell-node.css */

.cell-node {
  position: relative;
  min-width: 200px;
  min-height: 160px;
  /* Octagon via clip-path */
  clip-path: polygon(
    30% 0%, 70% 0%, 100% 30%, 100% 70%,
    70% 100%, 30% 100%, 0% 70%, 0% 30%
  );
}

.cell-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.cell-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Type-specific colors */
.cell-type-logic { --cell-color: #00d4aa; }
.cell-type-integration { --cell-color: #a855f7; }
.cell-type-data { --cell-color: #3b82f6; }
.cell-type-security { --cell-color: #ef4444; }
.cell-type-channel { --cell-color: #22c55e; }
.cell-type-external { --cell-color: #6b7280; }

.cell-node {
  background: color-mix(in srgb, var(--cell-color) 15%, transparent);
  border: 2px solid var(--cell-color);
}

.cell-node.selected {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cell-color) 40%, transparent);
}

/* Editable inputs */
.cell-name-input,
.cell-type-select {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: inherit;
  padding: 4px 8px;
  font: inherit;
}

.cell-name-input:focus,
.cell-type-select:focus {
  outline: none;
  border-color: var(--cell-color);
}

/* Connection handles styled as gateways */
.cell-handle {
  width: 12px;
  height: 12px;
  background: var(--cell-color);
  border: 2px solid white;
}

.cell-handle.northbound,
.cell-handle.southbound {
  /* External traffic indicators */
  background: #ff6b9d;
}
```

---

## Part 10: Collaborative Editing Architecture

### 10.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Collaborative CellDSL                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   VS Code    │    │   Web App    │    │  Embed View  │              │
│  │  Extension   │    │   (React)    │    │  (Readonly)  │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                        │
│         └─────────────┬─────┴───────────────────┘                        │
│                       │                                                  │
│                       ▼                                                  │
│         ┌─────────────────────────────┐                                  │
│         │    @celldsl/collab-client   │  ◄── Shared package             │
│         │  ┌───────────────────────┐  │                                  │
│         │  │   Y.Doc (Yjs)         │  │                                  │
│         │  │  ┌─────────────────┐  │  │                                  │
│         │  │  │ Y.Text: source  │  │  │  ◄── DSL source code            │
│         │  │  │ Y.Map: diagram  │  │  │  ◄── Visual diagram state       │
│         │  │  │ Y.Map: meta     │  │  │  ◄── Document metadata          │
│         │  │  └─────────────────┘  │  │                                  │
│         │  └───────────────────────┘  │                                  │
│         │  ┌───────────────────────┐  │                                  │
│         │  │   Awareness CRDT     │  │  ◄── Cursors, selections         │
│         │  └───────────────────────┘  │                                  │
│         └─────────────┬───────────────┘                                  │
│                       │                                                  │
│                       ▼                                                  │
│         ┌─────────────────────────────┐                                  │
│         │    WebSocket Provider       │                                  │
│         │  (HocuspocusProvider)       │                                  │
│         └─────────────┬───────────────┘                                  │
│                       │                                                  │
└───────────────────────┼──────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hocuspocus Server                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  Auth Hook     │  │  Persistence   │  │  Webhooks      │             │
│  │  (JWT verify)  │  │  (PostgreSQL)  │  │  (on change)   │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    Redis (Scaling)                              │     │
│  │  - Cross-instance pub/sub                                       │     │
│  │  - Room state replication                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Dual-State Synchronization Pattern

CellDSL has two views of the same data:
1. **Text View**: DSL source code (for code editor)
2. **Diagram View**: Visual representation (for React Flow canvas)

**Synchronization Strategy:**

```typescript
// packages/collab-client/src/sync/dual-state.ts

import * as Y from 'yjs';
import { parse, stringify } from '@celldsl/core';
import { DiagramState } from '@celldsl/renderer';

export class DualStateSync {
  private doc: Y.Doc;
  private source: Y.Text;
  private diagram: Y.Map<any>;
  private isSyncing = false;
  
  constructor(doc: Y.Doc) {
    this.doc = doc;
    this.source = doc.getText('source');
    this.diagram = doc.getMap('diagram');
    
    // Watch source changes → update diagram
    this.source.observe(() => {
      if (!this.isSyncing) {
        this.sourceTodiagram();
      }
    });
    
    // Watch diagram changes → update source
    this.diagram.observeDeep(() => {
      if (!this.isSyncing) {
        this.diagramToSource();
      }
    });
  }
  
  private sourceTodiagram() {
    this.isSyncing = true;
    try {
      const ast = parse(this.source.toString());
      const diagramState = astToDiagramState(ast);
      
      this.doc.transact(() => {
        // Update diagram map from AST
        updateYMapFromState(this.diagram, diagramState);
      });
    } catch (e) {
      // Parse error - keep diagram as-is, show error in editor
    } finally {
      this.isSyncing = false;
    }
  }
  
  private diagramToSource() {
    this.isSyncing = true;
    try {
      const diagramState = yMapToState(this.diagram);
      const ast = diagramStateToAst(diagramState);
      const newSource = stringify(ast);
      
      // Use Y.Text diff to minimize changes
      this.doc.transact(() => {
        applyTextDiff(this.source, this.source.toString(), newSource);
      });
    } finally {
      this.isSyncing = false;
    }
  }
}
```

### 10.3 Y.Doc Schema for CellDSL

```typescript
// packages/collab-client/src/schema.ts

import * as Y from 'yjs';

export interface CellDSLDocSchema {
  // DSL source code (for code editor sync)
  source: Y.Text;
  
  // Diagram state (for React Flow sync)
  diagram: {
    cells: Y.Map<{
      id: string;
      name: string;
      type: string;
      position: { x: number; y: number };
      components: Y.Array<{
        id: string;
        type: string;
        name: string;
      }>;
    }>;
    
    connections: Y.Map<{
      id: string;
      source: string;
      target: string;
      sourceHandle: string;
      targetHandle: string;
      label?: string;
    }>;
    
    externals: Y.Map<{...}>;
    users: Y.Map<{...}>;
  };
  
  // Document metadata
  meta: Y.Map<{
    title: string;
    createdAt: number;
    updatedAt: number;
    version: number;
  }>;
}

export function createCellDSLDoc(): Y.Doc {
  const doc = new Y.Doc();
  
  // Initialize with empty structure
  doc.getText('source');
  const diagram = doc.getMap('diagram');
  diagram.set('cells', new Y.Map());
  diagram.set('connections', new Y.Map());
  diagram.set('externals', new Y.Map());
  diagram.set('users', new Y.Map());
  
  const meta = doc.getMap('meta');
  meta.set('title', 'Untitled');
  meta.set('createdAt', Date.now());
  meta.set('updatedAt', Date.now());
  meta.set('version', 1);
  
  return doc;
}
```

### 10.4 React Flow + Yjs Integration

```typescript
// packages/collab-client/src/react-flow/useCollaborativeFlow.ts

import { useCallback, useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, Node, Edge } from 'reactflow';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

export function useCollaborativeFlow(roomId: string) {
  // Create Yjs document and provider
  const { doc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: 'wss://your-collab-server.com',
      name: roomId,
      document: doc,
    });
    return { doc, provider };
  }, [roomId]);
  
  // Get shared types
  const yNodes = doc.getMap('diagram').get('cells') as Y.Map<any>;
  const yEdges = doc.getMap('diagram').get('connections') as Y.Map<any>;
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Sync Yjs → React Flow
  useEffect(() => {
    const syncFromYjs = () => {
      const newNodes: Node[] = [];
      yNodes.forEach((value, key) => {
        newNodes.push(yNodeToReactFlowNode(key, value));
      });
      setNodes(newNodes);
      
      const newEdges: Edge[] = [];
      yEdges.forEach((value, key) => {
        newEdges.push(yEdgeToReactFlowEdge(key, value));
      });
      setEdges(newEdges);
    };
    
    yNodes.observeDeep(syncFromYjs);
    yEdges.observeDeep(syncFromYjs);
    syncFromYjs(); // Initial sync
    
    return () => {
      yNodes.unobserveDeep(syncFromYjs);
      yEdges.unobserveDeep(syncFromYjs);
    };
  }, [yNodes, yEdges, setNodes, setEdges]);
  
  // Handle React Flow changes → Yjs
  const handleNodesChange = useCallback((changes) => {
    doc.transact(() => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          const yNode = yNodes.get(change.id);
          if (yNode) {
            yNode.set('position', change.position);
          }
        }
        // Handle other change types...
      }
    });
    onNodesChange(changes);
  }, [doc, yNodes, onNodesChange]);
  
  // Awareness for cursors
  const awareness = provider.awareness;
  
  useEffect(() => {
    // Set local user info
    awareness.setLocalStateField('user', {
      name: 'User ' + Math.floor(Math.random() * 100),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    });
  }, [awareness]);
  
  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    awareness,
    provider,
  };
}
```

### 10.5 VS Code Extension + CRDT

For VS Code, we don't need React Flow—we sync the **source code** via the Language Server:

```typescript
// extensions/vscode/src/collaboration/collab-client.ts

import * as vscode from 'vscode';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

export class CollaborationClient {
  private doc: Y.Doc;
  private provider: HocuspocusProvider;
  private yText: Y.Text;
  
  constructor(roomId: string) {
    this.doc = new Y.Doc();
    this.provider = new HocuspocusProvider({
      url: 'wss://your-collab-server.com',
      name: roomId,
      document: this.doc,
    });
    this.yText = this.doc.getText('source');
  }
  
  bindToDocument(document: vscode.TextDocument) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Initial sync from document to Yjs
    this.yText.insert(0, document.getText());
    
    // Watch Yjs changes → update VS Code document
    this.yText.observe((event) => {
      if (event.transaction.local) return;
      
      const edit = new vscode.WorkspaceEdit();
      // Apply remote changes to document
      // ... delta handling
      vscode.workspace.applyEdit(edit);
    });
    
    // Watch VS Code changes → update Yjs
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document !== document) return;
      
      this.doc.transact(() => {
        for (const change of event.contentChanges) {
          const start = change.rangeOffset;
          const delCount = change.rangeLength;
          const text = change.text;
          
          if (delCount > 0) {
            this.yText.delete(start, delCount);
          }
          if (text.length > 0) {
            this.yText.insert(start, text);
          }
        }
      });
    });
  }
  
  // Show remote cursors via decorations
  private updateCursors() {
    const decorations: vscode.DecorationOptions[] = [];
    
    this.provider.awareness.getStates().forEach((state, clientId) => {
      if (clientId === this.doc.clientID) return;
      
      const user = state.user;
      const cursor = state.cursor;
      if (cursor) {
        decorations.push({
          range: new vscode.Range(cursor.line, cursor.ch, cursor.line, cursor.ch + 1),
          renderOptions: {
            after: {
              contentText: user.name,
              backgroundColor: user.color,
            }
          }
        });
      }
    });
    
    // Apply decorations...
  }
}
```

### 10.6 VS Code Live Share Integration (Alternative)

If using Live Share instead of custom CRDT:

```typescript
// extensions/vscode/src/liveshare/liveshare-service.ts

import * as vsls from 'vsls';
import * as vscode from 'vscode';

export class CellDSLLiveShareService {
  private liveShare: vsls.LiveShare | null = null;
  private sharedService: vsls.SharedService | null = null;
  
  async initialize() {
    this.liveShare = await vsls.getApi();
    if (!this.liveShare) return;
    
    // Host: share diagram state service
    if (this.liveShare.session?.role === vsls.Role.Host) {
      this.sharedService = await this.liveShare.shareService('celldsl-diagram');
      
      this.sharedService.onNotify('updateDiagram', (data) => {
        // Broadcast diagram updates to all guests
        this.sharedService?.notify('diagramUpdated', data);
      });
    }
    
    // Guest: consume shared service
    if (this.liveShare.session?.role === vsls.Role.Guest) {
      const proxy = await this.liveShare.getSharedService('celldsl-diagram');
      
      proxy?.onNotify('diagramUpdated', (data) => {
        // Update local preview webview
        this.updatePreview(data);
      });
    }
  }
  
  // Sync diagram state through Live Share
  async broadcastDiagramUpdate(diagramState: any) {
    if (this.sharedService) {
      this.sharedService.notify('diagramUpdated', diagramState);
    }
  }
}
```

### 10.7 Monorepo Structure with Collaboration

```
celldsl/
├── apps/
│   ├── web/                          # Main web app
│   ├── collab-server/                # Hocuspocus server ⭐ NEW
│   │   ├── src/
│   │   │   ├── server.ts             # Main Hocuspocus server
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── persistence.ts        # PostgreSQL adapter
│   │   │   └── webhooks.ts           # On-change notifications
│   │   ├── package.json
│   │   └── Dockerfile
│   └── docs/
├── packages/
│   ├── core/                         # Parser, AST
│   ├── renderer/                     # React Flow components
│   │   ├── src/
│   │   │   ├── nodes/
│   │   │   │   ├── CellNode.tsx      # Interactive cell node
│   │   │   │   ├── ComponentNode.tsx
│   │   │   │   └── UserNode.tsx
│   │   │   ├── edges/
│   │   │   ├── hooks/
│   │   │   │   └── useCollaborativeFlow.ts ⭐
│   │   │   └── index.ts
│   ├── collab-client/                # Shared CRDT logic ⭐ NEW
│   │   ├── src/
│   │   │   ├── schema.ts             # Y.Doc schema
│   │   │   ├── sync/
│   │   │   │   ├── dual-state.ts     # Source ↔ Diagram sync
│   │   │   │   └── awareness.ts      # Cursor/presence
│   │   │   ├── providers/
│   │   │   │   ├── hocuspocus.ts
│   │   │   │   └── webrtc.ts         # P2P option
│   │   │   └── index.ts
│   │   └── package.json
│   ├── editor-support/               # Monaco integration
│   │   ├── src/
│   │   │   ├── monaco/
│   │   │   │   ├── y-monaco.ts       # Yjs binding ⭐
│   │   │   │   └── ...
│   └── language-server/
├── extensions/
│   └── vscode/
│       ├── src/
│       │   ├── collaboration/        # ⭐ NEW
│       │   │   ├── collab-client.ts
│       │   │   └── liveshare.ts
│       │   ├── preview/
│       │   └── extension.ts
└── turbo.json
```

### 10.8 Implementation Priority

| Phase | Feature | Complexity | Priority |
|-------|---------|------------|----------|
| MVP | Static diagram rendering (React Flow) | Medium | P0 |
| MVP | In-place editing (no collab) | Medium | P0 |
| V1 | URL sharing (no collab) | Low | P1 |
| V2 | Real-time collaboration (Yjs + Hocuspocus) | High | P2 |
| V2 | Awareness (cursors, presence) | Medium | P2 |
| V3 | VS Code Live Share integration | Medium | P3 |
| V3 | Offline support (y-indexeddb) | Low | P3 |

---

## Summary: Rendering + Collaboration Recommendations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Diagram Library** | React Flow | Native React/HTML, MIT license, Yjs integration |
| **Custom Shapes** | React components | Full control, forms, dropdowns, inputs |
| **Styling** | CSS clip-path + variables | Octagon shape, theme support |
| **CRDT Library** | Yjs | Battle-tested, best editor bindings |
| **Collaboration Server** | Hocuspocus | Production-ready, scales with Redis |
| **VS Code Collab** | Hybrid (CRDT + Live Share) | CRDT for custom, Live Share for text |
| **Sync Strategy** | Dual-state (source ↔ diagram) | Both text and visual editing |

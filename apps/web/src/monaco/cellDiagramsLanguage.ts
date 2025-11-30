/**
 * Monaco Editor Language Configuration for CellDL (Cell Definition Language)
 *
 * Updated for new CellDL syntax with support for:
 * - Workspace root block
 * - Cells with multiple gateways (ingress/egress)
 * - Flow definitions for traffic patterns
 * - Route definitions inside gateways
 * - Component blocks with env variables
 * - Nested cells
 */

import type * as Monaco from 'monaco-editor';

export const LANGUAGE_ID = 'cell-diagrams';

/**
 * Language configuration for CellDL
 */
export const languageConfiguration: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  folding: {
    markers: {
      start: /^\s*\{/,
      end: /^\s*\}/,
    },
  },
};

/**
 * Monarch tokenizer for CellDL syntax highlighting
 */
export const monarchTokensProvider: Monaco.languages.IMonarchLanguage = {
  defaultToken: 'invalid',

  // Top-level keywords
  topLevelKeywords: ['workspace', 'cell', 'external', 'user', 'application', 'flow'],

  // Block keywords
  blockKeywords: ['gateway', 'component', 'database', 'function', 'legacy', 'cluster', 'env'],

  // Property keywords
  propertyKeywords: [
    'version', 'description', 'property', 'replicas',
    'protocol', 'port', 'context', 'target', 'policy',
    'exposes', 'policies', 'auth', 'federated', 'local-sts',
    'provides', 'channels', 'cells', 'route', 'source', 'engine', 'storage',
  ],

  // Gateway direction keywords
  directionKeywords: ['ingress', 'egress'],

  // Cell types
  cellTypes: ['logic', 'integration', 'data', 'security', 'channel', 'legacy'],

  // Component types (full and short)
  componentTypes: [
    'microservice', 'function', 'database', 'broker', 'cache', 'gateway',
    'idp', 'sts', 'userstore',
    'esb', 'adapter', 'transformer',
    'webapp', 'mobile', 'iot',
    'legacy',
    // Short forms
    'ms', 'fn', 'db',
  ],

  // Protocol keywords
  protocolKeywords: ['https', 'http', 'grpc', 'tcp', 'mtls', 'kafka'],

  // Connection direction keywords
  connectionDirections: ['northbound', 'southbound', 'eastbound', 'westbound'],

  // Endpoint types
  endpointTypes: ['api', 'events', 'stream'],

  // External system types
  externalTypes: ['saas', 'partner', 'enterprise'],

  // User types
  userTypes: ['external', 'internal', 'system'],

  operators: ['->', '='],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Top-level keywords
      [
        /\b(workspace|cell|external|user|application|flow)\b/,
        'keyword',
      ],

      // Block keywords
      [
        /\b(gateway|component|database|function|cluster|env)\b/,
        'keyword.block',
      ],

      // Gateway direction keywords
      [/\b(ingress|egress)\b/, 'keyword.direction'],

      // Property keywords
      [
        /\b(version|description|property|replicas|protocol|port|context|target|policy|exposes|policies|auth|federated|provides|channels|cells|route|source|engine|storage)\b/,
        'keyword.property',
      ],

      // local-sts (special case with hyphen)
      [/\blocal-sts\b/, 'keyword.property'],

      // Protocol keywords
      [/\b(https|http|grpc|tcp|mtls|kafka)\b/, 'type.protocol'],

      // Type prefix (type:)
      [/\btype:/, 'keyword.property'],

      // Cell types
      [/\b(logic|integration|data|security|channel)\b/, 'type.cell'],

      // Component types (full names)
      [
        /\b(microservice|broker|cache|idp|sts|userstore|esb|adapter|transformer|webapp|mobile|iot)\b/,
        'type.component',
      ],

      // Component types (short forms)
      [/\b(ms|fn|db)\b/, 'type.component.short'],

      // Connection directions
      [/\b(northbound|southbound|eastbound|westbound)\b/, 'type.direction'],

      // Endpoint types
      [/\b(api|events|stream)\b/, 'type.endpoint'],

      // External system types
      [/\b(saas|partner|enterprise)\b/, 'type.external'],

      // User types
      [/\b(internal|system)\b/, 'type.user'],

      // legacy - can be cell type or component type
      [/\blegacy\b/, 'type.legacy'],

      // Boolean literals
      [/\b(true|false)\b/, 'keyword.boolean'],

      // Numbers
      [/-?\d+(\.\d+)?/, 'number'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/"/, 'string', '@string'],

      // Identifiers
      [/[a-zA-Z_][a-zA-Z0-9_-]*/, 'identifier'],

      // Operators
      [/->/, 'operator.arrow'],
      [/=/, 'operator.equals'],

      // Delimiters
      [/[{}]/, 'delimiter.bracket'],
      [/[\[\]]/, 'delimiter.square'],
      [/[()]/, 'delimiter.paren'],
      [/:/, 'delimiter.colon'],
      [/,/, 'delimiter.comma'],
      [/\./, 'delimiter.dot'],

      // Whitespace
      [/\s+/, 'white'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
  },
};

/**
 * Theme colors for CellDL
 */
export const themeRules: Monaco.editor.ITokenThemeRule[] = [
  // Keywords
  { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
  { token: 'keyword.block', foreground: 'c586c0' },
  { token: 'keyword.direction', foreground: 'dcdcaa', fontStyle: 'bold' },
  { token: 'keyword.property', foreground: '9cdcfe' },
  { token: 'keyword.boolean', foreground: '569cd6' },

  // Types
  { token: 'type.cell', foreground: 'dcdcaa', fontStyle: 'bold' },
  { token: 'type.component', foreground: '4ec9b0' },
  { token: 'type.component.short', foreground: '4ec9b0', fontStyle: 'italic' },
  { token: 'type.protocol', foreground: '4fc1ff' },
  { token: 'type.direction', foreground: 'ce9178', fontStyle: 'bold' },
  { token: 'type.endpoint', foreground: 'ce9178' },
  { token: 'type.external', foreground: '6a9955' },
  { token: 'type.user', foreground: '569cd6' },
  { token: 'type.legacy', foreground: 'd7ba7d' },

  // Other tokens
  { token: 'identifier', foreground: '9cdcfe' },
  { token: 'number', foreground: 'b5cea8' },
  { token: 'string', foreground: 'ce9178' },
  { token: 'string.escape', foreground: 'd7ba7d' },
  { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
  { token: 'operator.arrow', foreground: 'd4d4d4', fontStyle: 'bold' },
  { token: 'operator.equals', foreground: 'd4d4d4' },
  { token: 'delimiter', foreground: 'd4d4d4' },
];

/**
 * Register the CellDL language with Monaco
 */
export function registerCellDiagramsLanguage(monaco: typeof Monaco): void {
  // Register the language
  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.cell', '.celldl'],
    aliases: ['CellDL', 'Cell Diagrams', 'cell-diagrams', 'cell'],
    mimetypes: ['text/x-cell-diagrams', 'text/x-celldl'],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration);

  // Set monarch tokens provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokensProvider);

  // Define custom theme for CellDL
  monaco.editor.defineTheme('cell-diagrams-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: themeRules,
    colors: {},
  });
}

/**
 * Default CellDL sample code demonstrating the new syntax
 */
export const defaultSampleCode = `// CellDL (Cell Definition Language) Example
// E-Commerce Platform Architecture

workspace "E-Commerce Platform" {
  version "1.0.0"
  description "Modern e-commerce system using Cell-Based Architecture"

  // ============================================
  // Users
  // ============================================

  user "Web Customer" type:external {
    channels [web, mobile]
  }

  user "Admin" type:internal {
    channels [web]
  }

  // ============================================
  // User Management Cell
  // ============================================

  cell "User Management" type:logic {
    description "Handles user authentication and profiles"

    gateway ingress {
      protocol https
      port 443
      context "/users"
      auth local-sts

      route "/login" -> auth-service
      route "/profile" -> profile-service
      route "/register" -> auth-service
    }

    component "auth-service" {
      source "company/auth-service:latest"
      port 8080
      env {
        JWT_SECRET = "secret"
        TOKEN_EXPIRY = "3600"
      }
    }

    component "profile-service" {
      source "company/profile-service:latest"
      port 8081
    }

    database "user-db" {
      engine postgresql
      storage "100Gi"
      version "15.0"
    }

    flow {
      auth-service -> user-db
      profile-service -> user-db
    }
  }

  // ============================================
  // Product Catalog Cell
  // ============================================

  cell "Product Catalog" type:logic {
    description "Product catalog and search"

    gateway ingress {
      protocol https
      port 443
      context "/products"

      route "/search" -> search-service
      route "/catalog" -> catalog-service
    }

    component "catalog-service" {
      source "company/catalog-service:latest"
      port 8080
    }

    component "search-service" {
      source "company/search-service:latest"
      port 8082
    }

    database "product-db" {
      engine postgresql
      storage "200Gi"
    }

    database "search-index" {
      engine elasticsearch
      storage "50Gi"
    }

    flow {
      catalog-service -> product-db
      search-service -> search-index
      catalog-service -> search-index : "sync products"
    }
  }

  // ============================================
  // Order Processing Cell
  // ============================================

  cell "Order Processing" type:logic {
    description "Order creation and fulfillment"

    gateway ingress "order-api" {
      protocol https
      port 443
      context "/orders"

      route "/create" -> order-service
      route "/cart" -> cart-service
    }

    gateway egress "payment-gateway" {
      protocol https
      target "https://api.stripe.com"
      policy retry
    }

    component "order-service" {
      source "company/order-service:latest"
      port 8080
    }

    component "cart-service" {
      source "company/cart-service:latest"
      port 8081
    }

    database "order-db" {
      engine postgresql
      storage "500Gi"
    }

    flow {
      cart-service -> order-service
      order-service -> order-db
    }
  }

  // ============================================
  // External Systems
  // ============================================

  external "Stripe" type:saas {
    provides [api]
  }

  external "SendGrid" type:saas {
    provides [api]
  }

  // ============================================
  // Inter-Cell Traffic Flows
  // ============================================

  flow "authentication" {
    UserManagement -> ProductCatalog : "verify user"
    UserManagement -> OrderProcessing : "authorize purchase"
  }

  flow "checkout" {
    ProductCatalog -> OrderProcessing : "add to cart"
    OrderProcessing -> Stripe : "process payment"
    OrderProcessing -> SendGrid : "send confirmation"
  }
}
`;

/**
 * Monaco Editor Language Configuration for Cell Diagrams DSL
 *
 * Updated for Cell-Based Architecture DSL with support for:
 * - Cells with gateway, components, clusters
 * - Virtual applications
 * - External systems and users
 * - Connection directions (N/S/E/W)
 */

import type * as Monaco from 'monaco-editor';

export const LANGUAGE_ID = 'cell-diagrams';

/**
 * Language configuration for Cell Diagrams
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
 * Monarch tokenizer for Cell Diagrams syntax highlighting
 */
export const monarchTokensProvider: Monaco.languages.IMonarchLanguage = {
  defaultToken: 'invalid',

  // Top-level keywords
  topLevelKeywords: ['diagram', 'cell', 'external', 'user', 'application', 'connections'],

  // Cell/Gateway property keywords
  propertyKeywords: [
    'label', 'type', 'gateway', 'components', 'cluster',
    'exposes', 'policies', 'auth', 'federated', 'local-sts',
    'provides', 'channels', 'version', 'cells', 'routes',
  ],

  // Attribute keywords
  attributeKeywords: [
    'tech', 'replicas', 'role', 'sidecar', 'provider', 'protocol', 'via',
  ],

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

  // Connection direction keywords
  directions: ['northbound', 'southbound', 'eastbound', 'westbound'],

  // Endpoint types
  endpointTypes: ['api', 'events', 'stream'],

  // External system types
  externalTypes: ['saas', 'partner', 'enterprise'],

  // User types
  userTypes: ['external', 'internal', 'system'],

  operators: ['->'],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Top-level keywords
      [
        /\b(diagram|cell|external|user|application|connections)\b/,
        'keyword',
      ],

      // Property keywords
      [
        /\b(label|type|gateway|components|cluster|exposes|policies|auth|federated|provides|channels|version|cells|routes)\b/,
        'keyword.property',
      ],

      // local-sts (special case with hyphen)
      [/\blocal-sts\b/, 'keyword.property'],

      // Attribute keywords
      [/\b(tech|replicas|role|sidecar|provider|protocol|via)\b/, 'keyword.attribute'],

      // Cell types
      [/\b(logic|integration|data|security|channel)\b/, 'type.cell'],

      // Component types (full names)
      [
        /\b(microservice|function|database|broker|cache|gateway|idp|sts|userstore|esb|adapter|transformer|webapp|mobile|iot)\b/,
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
 * Theme colors for Cell Diagrams
 */
export const themeRules: Monaco.editor.ITokenThemeRule[] = [
  // Keywords
  { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
  { token: 'keyword.property', foreground: '9cdcfe' },
  { token: 'keyword.attribute', foreground: '9cdcfe', fontStyle: 'italic' },
  { token: 'keyword.boolean', foreground: '569cd6' },

  // Types
  { token: 'type.cell', foreground: 'dcdcaa', fontStyle: 'bold' },
  { token: 'type.component', foreground: '4ec9b0' },
  { token: 'type.component.short', foreground: '4ec9b0', fontStyle: 'italic' },
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
  { token: 'delimiter', foreground: 'd4d4d4' },
];

/**
 * Register the Cell Diagrams language with Monaco
 */
export function registerCellDiagramsLanguage(monaco: typeof Monaco): void {
  // Register the language
  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.cell'],
    aliases: ['Cell Diagrams', 'cell-diagrams', 'cell'],
    mimetypes: ['text/x-cell-diagrams'],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration);

  // Set monarch tokens provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchTokensProvider);

  // Define custom theme for Cell Diagrams
  monaco.editor.defineTheme('cell-diagrams-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: themeRules,
    colors: {},
  });
}

/**
 * Default Cell Diagrams sample code (Cell-Based Architecture)
 * Tests three-zone layout: Header (northbound) -> Middle (cells) -> Bottom (southbound)
 */
export const defaultSampleCode = `// Cell-Based Architecture Example
// Testing Three-Zone Layout with Multiple Cells and External Services

diagram ECommerceSystem {

  // ============================================
  // HEADER ZONE: Users and northbound externals
  // ============================================

  // Users accessing the system
  user WebUser {
    type: external
  }

  user MobileUser {
    type: external
  }

  user AdminUser {
    type: internal
  }

  // Frontend applications (connect northbound to cells)
  external WebApp {
    label: "Web Application"
    type: enterprise
    provides: [api]
  }

  external MobileApp {
    label: "Mobile App"
    type: enterprise
    provides: [api]
  }

  external AdminPortal {
    label: "Admin Portal"
    type: enterprise
    provides: [api]
  }

  // ============================================
  // MIDDLE ZONE: Cells arranged horizontally
  // ============================================

  // User Management Cell
  cell UserCell {
    label: "User Management"
    type: logic

    gateway {
      label: "User API Gateway"
      exposes: [api]
    }

    components {
      microservice AuthService
      microservice ProfileService
      database UserDB [tech: "PostgreSQL"]
      cache SessionCache [tech: "Redis"]
    }

    connections {
      AuthService -> UserDB
      AuthService -> SessionCache
      ProfileService -> UserDB
    }
  }

  // Product Catalog Cell
  cell ProductCell {
    label: "Product Catalog"
    type: logic

    gateway {
      label: "Product API Gateway"
      exposes: [api]
    }

    components {
      microservice CatalogService
      microservice SearchService
      microservice InventoryService
      database ProductDB [tech: "PostgreSQL"]
      cache ProductCache [tech: "Redis"]
    }

    connections {
      CatalogService -> ProductDB
      CatalogService -> ProductCache
      SearchService -> ProductCache
      InventoryService -> ProductDB
    }
  }

  // Order Processing Cell
  cell OrderCell {
    label: "Order Processing"
    type: logic

    gateway {
      label: "Order API Gateway"
      exposes: [api]
    }

    components {
      microservice OrderService
      microservice CartService
      microservice CheckoutService
      database OrderDB [tech: "PostgreSQL"]
      broker OrderQueue [tech: "RabbitMQ"]
    }

    connections {
      CartService -> OrderService
      OrderService -> OrderDB
      CheckoutService -> OrderService
      CheckoutService -> OrderQueue
    }
  }

  // Notification Cell
  cell NotificationCell {
    label: "Notifications"
    type: logic

    gateway {
      label: "Notification Gateway"
      exposes: [api]
    }

    components {
      microservice EmailService
      microservice PushService
      microservice SMSService
      broker NotificationQueue [tech: "RabbitMQ"]
    }

    connections {
      NotificationQueue -> EmailService
      NotificationQueue -> PushService
      NotificationQueue -> SMSService
    }
  }

  // ============================================
  // BOTTOM ZONE: Southbound external services
  // ============================================

  // Payment providers (cells connect southbound)
  external StripeAPI {
    label: "Stripe Payment"
    type: saas
    provides: [api]
  }

  external PayPalAPI {
    label: "PayPal"
    type: saas
    provides: [api]
  }

  // Email/SMS providers
  external SendGrid {
    label: "SendGrid Email"
    type: saas
    provides: [api]
  }

  external TwilioAPI {
    label: "Twilio SMS"
    type: saas
    provides: [api]
  }

  // Shipping providers
  external ShippingAPI {
    label: "Shipping Provider"
    type: saas
    provides: [api]
  }

  // Analytics
  external AnalyticsAPI {
    label: "Analytics Platform"
    type: saas
    provides: [api]
  }

  // ============================================
  // CONNECTIONS
  // ============================================
  connections {
    // User to Frontend (header connections)
    WebUser -> WebApp
    MobileUser -> MobileApp
    AdminUser -> AdminPortal

    // Frontend to Cells (northbound - places frontends in header)
    WebApp -> UserCell [northbound]
    WebApp -> ProductCell [northbound]
    WebApp -> OrderCell [northbound]
    MobileApp -> UserCell [northbound]
    MobileApp -> ProductCell [northbound]
    MobileApp -> OrderCell [northbound]
    AdminPortal -> UserCell [northbound]
    AdminPortal -> NotificationCell [northbound]

    // Cell to Cell (eastbound - horizontal connections)
    UserCell -> ProductCell [eastbound]
    ProductCell -> OrderCell [eastbound]
    OrderCell -> NotificationCell [eastbound]

    // Cell to External Services (southbound - places externals in bottom)
    OrderCell -> StripeAPI [southbound]
    OrderCell -> PayPalAPI [southbound]
    OrderCell -> ShippingAPI [southbound]
    NotificationCell -> SendGrid [southbound]
    NotificationCell -> TwilioAPI [southbound]
    ProductCell -> AnalyticsAPI [southbound]
  }

}
`;

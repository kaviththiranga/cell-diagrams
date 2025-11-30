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
 */
export const defaultSampleCode = `// Cell-Based Architecture Example
// Based on reference diagram

diagram ProjectExample {

  // User accessing the system
  user EndUser {
    type: external
  }

  // Frontend SPA
  external FrontendSPA {
    label: "Frontend SPA"
    type: enterprise
    provides: [api]
  }

  // Project Foo Cell (Left cell)
  cell ProjectFoo {
    label: "Project Foo"
    type: logic

    gateway {
      label: "External gateway"
      exposes: [api]
    }

    components {
      microservice ComponentX
      microservice ComponentY
      microservice ComponentZ
      database DB1 [tech: "PostgreSQL"]
    }

    // Internal connections
    connections {
      ComponentX -> ComponentY
      ComponentX -> ComponentZ
      ComponentY -> DB1
    }
  }

  // Project Bar Cell (Right cell with multiple gateways)
  cell ProjectBar {
    label: "Project Bar"
    type: logic

    gateway {
      label: "Internal gateway"
      exposes: [api]
    }

    components {
      microservice ComponentA
      microservice ComponentB
      database DB2 [tech: "PostgreSQL"]
      legacy LegacyService
      adapter Adapter
    }

    // Internal connections
    connections {
      ComponentA -> ComponentB
      ComponentB -> DB2
      LegacyService -> Adapter
      Adapter -> ComponentB
    }
  }

  // External third-party service
  external ThirdParty {
    label: "Third-party service (external)"
    type: saas
    provides: [api]
  }

  // Inter-cell and external connections
  connections {
    // User to Frontend
    EndUser -> FrontendSPA

    // Frontend to Cell via gateway
    FrontendSPA -> ProjectFoo [northbound]

    // Cell to Cell (eastbound)
    ProjectFoo.ComponentY -> ProjectBar [eastbound]

    // Cell to external (southbound)
    ProjectBar -> ThirdParty [southbound]
  }

}
`;

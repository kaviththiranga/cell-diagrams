/**
 * Monaco Editor Language Configuration for Cell Diagrams DSL
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
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
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

  keywords: ['cell', 'external', 'user', 'connect', 'components', 'expose', 'name', 'type', 'via', 'label'],

  componentTypes: ['ms', 'fn', 'db', 'gw', 'svc', 'broker', 'cache', 'legacy', 'esb', 'idp'],

  cellTypes: ['logic', 'integration', 'data', 'security', 'channel'],

  endpointTypes: ['api', 'event', 'stream'],

  operators: ['->'],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Keywords
      [
        /\b(cell|external|user|connect|components|expose)\b/,
        'keyword',
      ],

      // Properties
      [/\b(name|type|via|label)\b/, 'keyword.property'],

      // Component types
      [/\b(ms|fn|db|gw|svc|broker|cache|legacy|esb|idp)\b/, 'type.component'],

      // Cell types
      [/\b(logic|integration|data|security|channel)\b/, 'type.cell'],

      // Endpoint types
      [/\b(api|event|stream)\b/, 'type.endpoint'],

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
      [/:/, 'delimiter.colon'],
      [/,/, 'delimiter.comma'],

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
  { token: 'keyword', foreground: 'c586c0' },
  { token: 'keyword.property', foreground: '9cdcfe' },
  { token: 'keyword.boolean', foreground: '569cd6' },
  { token: 'type.component', foreground: '4ec9b0' },
  { token: 'type.cell', foreground: 'dcdcaa' },
  { token: 'type.endpoint', foreground: 'ce9178' },
  { token: 'identifier', foreground: '9cdcfe' },
  { token: 'number', foreground: 'b5cea8' },
  { token: 'string', foreground: 'ce9178' },
  { token: 'string.escape', foreground: 'd7ba7d' },
  { token: 'comment', foreground: '6a9955' },
  { token: 'operator.arrow', foreground: 'd4d4d4' },
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
 * Default Cell Diagrams sample code
 */
export const defaultSampleCode = `// E-Commerce Cell Architecture Example

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

  connect {
    CustomerGateway -> CustomerService
    CustomerService -> CustomerDB
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
`;

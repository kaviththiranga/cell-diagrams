/**
 * Hover Service
 *
 * Provides hover information for symbols and keywords.
 */

import { Hover, MarkupKind, type Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  CELL_TYPE_LABELS,
  COMPONENT_TYPE_LABELS,
  type CellType,
  type ComponentType,
} from '@cell-diagrams/core';
import type { DocumentState } from '../documents';
import { getWordAtPosition, getWordRangeAtPosition } from '../documents/position-utils';
import type { Symbol, SymbolKind } from '../analysis';

/**
 * Get hover information at a position
 */
export function getHover(
  document: TextDocument,
  position: Position,
  state: DocumentState
): Hover | null {
  const word = getWordAtPosition(document, position);
  if (!word) {
    return null;
  }

  const range = getWordRangeAtPosition(document, position);

  // Check if it's a symbol
  const symbol = findSymbolAtPosition(word, state);
  if (symbol) {
    const hover: Hover = {
      contents: {
        kind: MarkupKind.Markdown,
        value: formatSymbolHover(symbol),
      },
    };
    if (range) {
      hover.range = range;
    }
    return hover;
  }

  // Check if it's a keyword
  const keywordHover = getKeywordHover(word);
  if (keywordHover) {
    const hover: Hover = {
      contents: {
        kind: MarkupKind.Markdown,
        value: keywordHover,
      },
    };
    if (range) {
      hover.range = range;
    }
    return hover;
  }

  return null;
}

/**
 * Find a symbol by name
 */
function findSymbolAtPosition(word: string, state: DocumentState): Symbol | undefined {
  const symbolTable = state.symbolTable;

  // Direct lookup
  const direct = symbolTable.symbols.get(word);
  if (direct) {
    return direct;
  }

  // Search all symbols
  for (const symbol of symbolTable.symbols.values()) {
    if (symbol.name === word) {
      return symbol;
    }
  }

  return undefined;
}

/**
 * Format hover content for a symbol
 */
function formatSymbolHover(symbol: Symbol): string {
  const lines: string[] = [];

  // Header with icon and kind
  const icon = getSymbolIcon(symbol.kind);
  lines.push(`### ${icon} ${symbol.name}`);
  lines.push('');

  // Type information
  if (symbol.typeInfo) {
    const typeLabel = getTypeLabel(symbol.kind, symbol.typeInfo);
    lines.push(`**Type:** ${typeLabel}`);
  }

  // Kind
  lines.push(`**Kind:** ${capitalizeFirst(symbol.kind)}`);

  // Scope
  if (symbol.scope) {
    lines.push(`**Scope:** ${symbol.scope}`);
  }

  // Label
  if (symbol.label && symbol.label !== symbol.name) {
    lines.push(`**Label:** ${symbol.label}`);
  }

  // Description
  if (symbol.description) {
    lines.push('');
    lines.push(`*${symbol.description}*`);
  }

  // References count
  if (symbol.references.length > 0) {
    lines.push('');
    lines.push(`*${symbol.references.length} reference(s)*`);
  }

  return lines.join('\n');
}

/**
 * Get icon for symbol kind
 */
function getSymbolIcon(kind: SymbolKind): string {
  switch (kind) {
    case 'cell':
      return '$(symbol-class)';
    case 'component':
      return '$(symbol-method)';
    case 'gateway':
      return '$(symbol-interface)';
    case 'user':
      return '$(symbol-field)';
    case 'external':
      return '$(symbol-constant)';
    case 'flow':
      return '$(symbol-event)';
    case 'cluster':
      return '$(symbol-array)';
    case 'application':
      return '$(symbol-namespace)';
    default:
      return '$(symbol-misc)';
  }
}

/**
 * Get type label from type info
 */
function getTypeLabel(kind: SymbolKind, typeInfo: string): string {
  if (kind === 'cell') {
    return CELL_TYPE_LABELS[typeInfo as CellType] ?? typeInfo;
  }
  if (kind === 'component') {
    return COMPONENT_TYPE_LABELS[typeInfo as ComponentType] ?? typeInfo;
  }
  return typeInfo;
}

/**
 * Get hover documentation for keywords
 */
function getKeywordHover(word: string): string | null {
  const keywords: Record<string, string> = {
    // Top-level keywords
    workspace: '**workspace**\n\nDefines a CellDL workspace containing cells, flows, and other definitions.',
    cell: '**cell**\n\nDefines a cell - the fundamental unit in Cell-Based Architecture. Cells are self-contained, independently deployable units.',
    external: '**external**\n\nDefines an external system (SaaS, partner, or enterprise) that the architecture integrates with.',
    user: '**user**\n\nDefines a user or actor that interacts with the system.',
    application: '**application**\n\nDefines a virtual application - a logical grouping of related cells.',
    flow: '**flow**\n\nDefines traffic patterns and data flow between components and cells.',

    // Cell body keywords
    gateway: '**gateway**\n\nDefines a gateway at the cell boundary - the control point for all cell access (ingress/egress).',
    component: '**component**\n\nDefines a component inside a cell (microservice, function, etc.).',
    database: '**database**\n\nDefines a database component with engine and storage configuration.',
    function: '**function**\n\nDefines a serverless function component.',
    cluster: '**cluster**\n\nDefines a cluster of related components (e.g., database replicas).',

    // Gateway keywords
    ingress: '**ingress**\n\nGateway direction for incoming traffic into the cell.',
    egress: '**egress**\n\nGateway direction for outgoing traffic from the cell.',
    route: '**route**\n\nDefines a route mapping a path to a target component.',

    // Cell types
    logic: '**logic**\n\nCell type for microservices, functions, gateways, and lightweight storage.',
    integration: '**integration**\n\nCell type for ESB, adapters, transformers, and integration microservices.',
    data: '**data**\n\nCell type for RDBMS, NoSQL, file storage, and message brokers.',
    security: '**security**\n\nCell type for IDP, STS, and user stores.',
    channel: '**channel**\n\nCell type for web apps, mobile apps, IoT, and portlets.',
    legacy: '**legacy**\n\nCell type for existing systems and COTS products.',

    // Component types
    microservice: '**microservice**\n\nA small, independently deployable service.',
    broker: '**broker**\n\nA message broker for async communication.',
    cache: '**cache**\n\nA caching layer for performance optimization.',
    idp: '**idp** (Identity Provider)\n\nHandles authentication and identity management.',
    sts: '**sts** (Security Token Service)\n\nIssues and validates security tokens.',
    userstore: '**userstore**\n\nStores user credentials and profile data.',
    esb: '**esb** (Enterprise Service Bus)\n\nCentralized integration platform.',
    adapter: '**adapter**\n\nConnects disparate systems with different protocols.',
    transformer: '**transformer**\n\nTransforms data between formats.',
    webapp: '**webapp**\n\nA web application frontend.',
    mobile: '**mobile**\n\nA mobile application.',
    iot: '**iot**\n\nAn IoT device or gateway.',

    // Protocols
    https: '**https**\n\nHTTP over TLS - secure web protocol.',
    http: '**http**\n\nPlain HTTP protocol.',
    grpc: '**grpc**\n\nHigh-performance RPC framework.',
    tcp: '**tcp**\n\nRaw TCP connection.',
    mtls: '**mtls** (Mutual TLS)\n\nTwo-way TLS authentication.',
    kafka: '**kafka**\n\nApache Kafka protocol for streaming.',

    // Endpoint types
    api: '**api**\n\nRequest-response endpoints (REST, GraphQL, gRPC).',
    events: '**events**\n\nEvent-driven endpoints (pub/sub).',
    stream: '**stream**\n\nData streaming endpoints.',

    // Auth
    'local-sts': '**local-sts**\n\nSecurity Token Service inside the cell.',
    federated: '**federated**\n\nFederated authentication to an external Identity Provider.',
  };

  return keywords[word] ?? null;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

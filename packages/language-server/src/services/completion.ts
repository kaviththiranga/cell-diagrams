/**
 * Completion Service
 *
 * Provides context-aware auto-completion for CellDL.
 */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  type Position,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentState } from '../documents';
import { getLineText } from '../documents/position-utils';

/**
 * Completion context based on cursor position
 */
type CompletionContext =
  | 'top-level'
  | 'cell-body'
  | 'gateway-body'
  | 'component-body'
  | 'flow-body'
  | 'flow-source'
  | 'type-value'
  | 'cell-type-value'
  | 'component-type-value'
  | 'protocol-value'
  | 'endpoint-type-value'
  | 'external-type-value'
  | 'user-type-value'
  | 'auth-value'
  | 'flow-reference'
  | 'workspace-body'
  | 'unknown';

/**
 * Get completions for a position in a document
 */
export function getCompletions(
  document: TextDocument,
  position: Position,
  state: DocumentState
): CompletionItem[] {
  const { context, currentCell } = determineContext(document, position);

  switch (context) {
    case 'top-level':
      return getTopLevelCompletions();
    case 'cell-body':
      return [...getCellBodyCompletions(), ...getScopedFlowCompletions(state, currentCell)];
    case 'gateway-body':
      return getGatewayBodyCompletions();
    case 'component-body':
      return getComponentBodyCompletions();
    case 'flow-body':
      return getScopedFlowCompletions(state, currentCell);
    case 'flow-source':
      return getScopedFlowCompletions(state, currentCell);
    case 'flow-reference':
      return getScopedFlowCompletions(state, currentCell);
    case 'workspace-body':
      return [...getTopLevelCompletions(), ...getScopedFlowCompletions(state, undefined)];
    case 'cell-type-value':
      return getCellTypeCompletions();
    case 'component-type-value':
      return getComponentTypeCompletions();
    case 'protocol-value':
      return getProtocolCompletions();
    case 'endpoint-type-value':
      return getEndpointTypeCompletions();
    case 'external-type-value':
      return getExternalTypeCompletions();
    case 'user-type-value':
      return getUserTypeCompletions();
    case 'auth-value':
      return getAuthCompletions();
    default:
      return getAllCompletions(state);
  }
}

/**
 * Result of context determination
 */
interface ContextResult {
  context: CompletionContext;
  currentCell: string | undefined;
}

/**
 * Determine completion context from cursor position
 */
function determineContext(document: TextDocument, position: Position): ContextResult {
  const line = getLineText(document, position.line);
  const textBeforeCursor = line.slice(0, position.character);
  const fullText = document.getText();
  const offset = document.offsetAt(position);
  const textBefore = fullText.slice(0, offset);

  // Extract current cell name if inside a cell
  const currentCell = getCurrentCellName(textBefore);

  // Check for specific patterns
  if (/type\s*:\s*$/.test(textBeforeCursor)) {
    // Determine if we're in a cell or component context
    if (isInsideBlock(textBefore, 'cell')) {
      return { context: 'cell-type-value', currentCell };
    }
    if (isInsideBlock(textBefore, 'external')) {
      return { context: 'external-type-value', currentCell };
    }
    if (isInsideBlock(textBefore, 'user')) {
      return { context: 'user-type-value', currentCell };
    }
    return { context: 'component-type-value', currentCell };
  }

  if (/protocol\s*:\s*$/.test(textBeforeCursor)) {
    return { context: 'protocol-value', currentCell };
  }

  if (/exposes\s*:\s*\[?\s*$/.test(textBeforeCursor) || /provides\s*:\s*\[?\s*$/.test(textBeforeCursor)) {
    return { context: 'endpoint-type-value', currentCell };
  }

  if (/auth\s*:\s*$/.test(textBeforeCursor)) {
    return { context: 'auth-value', currentCell };
  }

  // Check if we're at the start of a flow statement (after ->)
  if (/->[\s]*$/.test(textBeforeCursor)) {
    return { context: 'flow-reference', currentCell };
  }

  // Check block context
  if (isInsideBlock(textBefore, 'gateway')) {
    return { context: 'gateway-body', currentCell };
  }
  if (isInsideBlock(textBefore, 'flow')) {
    return { context: 'flow-body', currentCell };
  }
  if (isInsideBlock(textBefore, 'component') || isInsideBlock(textBefore, 'database') || isInsideBlock(textBefore, 'function')) {
    return { context: 'component-body', currentCell };
  }

  // Inside a cell - return cell-body (which includes both keywords AND flow completions)
  if (isInsideBlock(textBefore, 'cell')) {
    return { context: 'cell-body', currentCell };
  }

  // Inside workspace but not in a cell - always use workspace-body
  // which provides both top-level keywords (cell, external, etc.) AND flow completions
  if (isInsideBlock(textBefore, 'workspace')) {
    return { context: 'workspace-body', currentCell: undefined };
  }

  // Top level
  const depth = countBraceDepth(textBefore);
  if (depth === 0) {
    return { context: 'top-level', currentCell: undefined };
  }

  return { context: 'unknown', currentCell };
}

/**
 * Check if cursor is at a position where a flow source identifier would start
 */
function isAtFlowSourcePosition(textBeforeCursor: string): boolean {
  // At start of line (only whitespace before cursor on this line)
  const trimmed = textBeforeCursor.trim();
  if (trimmed === '') {
    return true;
  }
  // Or cursor is right after typing some identifier characters (partial completion)
  if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Extract the current cell name from text before cursor
 */
function getCurrentCellName(textBefore: string): string | undefined {
  // Find the last cell declaration that we're inside
  const cellMatches = [...textBefore.matchAll(/\bcell\s+(?:"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_-]*))/g)];

  for (let i = cellMatches.length - 1; i >= 0; i--) {
    const match = cellMatches[i];
    if (!match || match.index === undefined) continue;

    const cellName = match[1] || match[2]; // quoted or unquoted name
    const afterCell = textBefore.slice(match.index);
    const openBraces = (afterCell.match(/\{/g) || []).length;
    const closeBraces = (afterCell.match(/\}/g) || []).length;

    if (openBraces > closeBraces) {
      return cellName;
    }
  }

  return undefined;
}

/**
 * Check if cursor is inside a specific block type
 */
function isInsideBlock(text: string, blockType: string): boolean {
  const regex = new RegExp(`\\b${blockType}\\b[^{]*\\{`, 'g');
  const matches = text.match(regex) || [];
  if (matches.length === 0) return false;

  // Count closing braces after the last block open
  const lastMatch = text.lastIndexOf(`${blockType}`);
  if (lastMatch === -1) return false;

  const afterBlock = text.slice(lastMatch);
  const openBraces = (afterBlock.match(/\{/g) || []).length;
  const closeBraces = (afterBlock.match(/\}/g) || []).length;

  return openBraces > closeBraces;
}

/**
 * Count brace depth
 */
function countBraceDepth(text: string): number {
  const opens = (text.match(/\{/g) || []).length;
  const closes = (text.match(/\}/g) || []).length;
  return opens - closes;
}

/**
 * Top-level keyword completions
 */
function getTopLevelCompletions(): CompletionItem[] {
  return [
    {
      label: 'workspace',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a workspace',
      insertText: 'workspace "${1:name}" {\n\t$0\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'cell',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a cell',
      insertText: 'cell ${1:CellName} type:${2|logic,integration,data,security,channel,legacy|} {\n\t$0\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'external',
      kind: CompletionItemKind.Keyword,
      detail: 'Define an external system',
      insertText: 'external ${1:ExternalName} type:${2|saas,partner,enterprise|} {\n\t$0\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'user',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a user/actor',
      insertText: 'user ${1:UserName} type:${2|external,internal,system|}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'application',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a virtual application',
      insertText: 'application ${1:AppName} {\n\tcells: [${2:cell1, cell2}]\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'flow',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a flow block',
      insertText: 'flow ${1:flowName} {\n\t${2:source} -> ${3:destination}\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
  ];
}

/**
 * Cell body completions
 */
function getCellBodyCompletions(): CompletionItem[] {
  return [
    {
      label: 'gateway',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a gateway',
      insertText: 'gateway ${1|ingress,egress|} {\n\t$0\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'component',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a component',
      insertText: 'component ${1:name} {\n\tsource: "${2:image:tag}"\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'database',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a database',
      insertText: 'database ${1:name} {\n\tengine: ${2|postgres,mysql,mongodb,kafka|}\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'function',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a function',
      insertText: 'function ${1:name} {\n\tsource: "${2:image:tag}"\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'cluster',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a cluster',
      insertText: 'cluster ${1:name} {\n\ttype: ${2:database}\n\treplicas: ${3:3}\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    {
      label: 'flow',
      kind: CompletionItemKind.Keyword,
      detail: 'Define internal flows',
      insertText: 'flow {\n\t${1:source} -> ${2:destination}\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
    { label: 'label', kind: CompletionItemKind.Property, insertText: 'label: "${1:Label}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'type', kind: CompletionItemKind.Property, insertText: 'type: ${1|logic,integration,data,security,channel,legacy|}', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'description', kind: CompletionItemKind.Property, insertText: 'description: "${1:Description}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'replicas', kind: CompletionItemKind.Property, insertText: 'replicas: ${1:1}', insertTextFormat: InsertTextFormat.Snippet },
  ];
}

/**
 * Gateway body completions
 */
function getGatewayBodyCompletions(): CompletionItem[] {
  return [
    { label: 'protocol', kind: CompletionItemKind.Property, insertText: 'protocol: ${1|https,http,grpc,tcp,mtls,kafka|}', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'port', kind: CompletionItemKind.Property, insertText: 'port: ${1:443}', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'context', kind: CompletionItemKind.Property, insertText: 'context: "${1:/api}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'target', kind: CompletionItemKind.Property, insertText: 'target: "${1:url}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'exposes', kind: CompletionItemKind.Property, insertText: 'exposes: [${1|api,events,stream|}]', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'policies', kind: CompletionItemKind.Property, insertText: 'policies: [${1:"rate-limit"}]', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'auth', kind: CompletionItemKind.Property, insertText: 'auth: ${1|local-sts,federated|}', insertTextFormat: InsertTextFormat.Snippet },
    {
      label: 'route',
      kind: CompletionItemKind.Keyword,
      detail: 'Define a route',
      insertText: 'route "${1:/path}" -> ${2:component}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
  ];
}

/**
 * Component body completions
 */
function getComponentBodyCompletions(): CompletionItem[] {
  return [
    { label: 'source', kind: CompletionItemKind.Property, insertText: 'source: "${1:image:tag}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'port', kind: CompletionItemKind.Property, insertText: 'port: ${1:8080}', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'engine', kind: CompletionItemKind.Property, insertText: 'engine: ${1|postgres,mysql,mongodb,kafka|}', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'storage', kind: CompletionItemKind.Property, insertText: 'storage: "${1:100Gi}"', insertTextFormat: InsertTextFormat.Snippet },
    { label: 'version', kind: CompletionItemKind.Property, insertText: 'version: "${1:1.0}"', insertTextFormat: InsertTextFormat.Snippet },
    {
      label: 'env',
      kind: CompletionItemKind.Keyword,
      detail: 'Environment variables block',
      insertText: 'env {\n\t${1:KEY} = "${2:value}"\n}',
      insertTextFormat: InsertTextFormat.Snippet,
    },
  ];
}

/**
 * Scoped flow completions from symbol table
 * - Inside a cell: local components without prefix, external components with CellName.prefix
 * - Outside a cell: all components with CellName.prefix
 */
function getScopedFlowCompletions(state: DocumentState, currentCell: string | undefined): CompletionItem[] {
  const completions: CompletionItem[] = [];

  // Add cell references
  for (const symbol of state.symbolTable.getSymbolsByKind('cell')) {
    completions.push({
      label: symbol.name,
      kind: CompletionItemKind.Class,
      detail: `Cell (${symbol.typeInfo ?? 'logic'})`,
    });
  }

  // Add component references with scoping
  for (const symbol of state.symbolTable.getSymbolsByKind('component')) {
    const isLocalComponent = currentCell && symbol.scope === currentCell;

    if (isLocalComponent) {
      // Local component: suggest without prefix
      completions.push({
        label: symbol.name,
        kind: CompletionItemKind.Function,
        detail: `Component (${symbol.typeInfo ?? 'microservice'})`,
      });
    } else {
      // External component: suggest with full path
      const label = symbol.scope ? `${symbol.scope}.${symbol.name}` : symbol.name;
      completions.push({
        label,
        kind: CompletionItemKind.Function,
        detail: `Component (${symbol.typeInfo ?? 'microservice'})`,
      });
    }
  }

  // Add gateway references with scoping
  for (const symbol of state.symbolTable.getSymbolsByKind('gateway')) {
    const isLocalGateway = currentCell && symbol.scope === currentCell;

    if (isLocalGateway) {
      completions.push({
        label: symbol.name,
        kind: CompletionItemKind.Module,
        detail: 'Gateway',
      });
    } else {
      const label = symbol.scope ? `${symbol.scope}.${symbol.name}` : symbol.name;
      completions.push({
        label,
        kind: CompletionItemKind.Module,
        detail: 'Gateway',
      });
    }
  }

  // Add user references
  for (const symbol of state.symbolTable.getSymbolsByKind('user')) {
    completions.push({
      label: symbol.name,
      kind: CompletionItemKind.Variable,
      detail: `User (${symbol.typeInfo ?? 'external'})`,
    });
  }

  // Add external references
  for (const symbol of state.symbolTable.getSymbolsByKind('external')) {
    completions.push({
      label: symbol.name,
      kind: CompletionItemKind.Interface,
      detail: `External (${symbol.typeInfo ?? 'saas'})`,
    });
  }

  return completions;
}

/**
 * Flow completions from symbol table (legacy, all with full paths)
 */
function getFlowCompletions(state: DocumentState): CompletionItem[] {
  return getScopedFlowCompletions(state, undefined);
}

/**
 * Cell type completions
 */
function getCellTypeCompletions(): CompletionItem[] {
  return [
    { label: 'logic', kind: CompletionItemKind.EnumMember, detail: 'Microservices, functions, gateways' },
    { label: 'integration', kind: CompletionItemKind.EnumMember, detail: 'ESB, adapters, transformers' },
    { label: 'data', kind: CompletionItemKind.EnumMember, detail: 'Databases, brokers, storage' },
    { label: 'security', kind: CompletionItemKind.EnumMember, detail: 'IDP, STS, user stores' },
    { label: 'channel', kind: CompletionItemKind.EnumMember, detail: 'Web apps, mobile, IoT' },
    { label: 'legacy', kind: CompletionItemKind.EnumMember, detail: 'Legacy systems' },
  ];
}

/**
 * Component type completions
 */
function getComponentTypeCompletions(): CompletionItem[] {
  return [
    { label: 'microservice', kind: CompletionItemKind.EnumMember },
    { label: 'ms', kind: CompletionItemKind.EnumMember, detail: 'Alias for microservice' },
    { label: 'function', kind: CompletionItemKind.EnumMember },
    { label: 'fn', kind: CompletionItemKind.EnumMember, detail: 'Alias for function' },
    { label: 'database', kind: CompletionItemKind.EnumMember },
    { label: 'db', kind: CompletionItemKind.EnumMember, detail: 'Alias for database' },
    { label: 'broker', kind: CompletionItemKind.EnumMember },
    { label: 'cache', kind: CompletionItemKind.EnumMember },
    { label: 'gateway', kind: CompletionItemKind.EnumMember },
    { label: 'idp', kind: CompletionItemKind.EnumMember, detail: 'Identity Provider' },
    { label: 'sts', kind: CompletionItemKind.EnumMember, detail: 'Security Token Service' },
    { label: 'userstore', kind: CompletionItemKind.EnumMember },
    { label: 'esb', kind: CompletionItemKind.EnumMember, detail: 'Enterprise Service Bus' },
    { label: 'adapter', kind: CompletionItemKind.EnumMember },
    { label: 'transformer', kind: CompletionItemKind.EnumMember },
    { label: 'webapp', kind: CompletionItemKind.EnumMember },
    { label: 'mobile', kind: CompletionItemKind.EnumMember },
    { label: 'iot', kind: CompletionItemKind.EnumMember },
    { label: 'legacy', kind: CompletionItemKind.EnumMember },
  ];
}

/**
 * Protocol completions
 */
function getProtocolCompletions(): CompletionItem[] {
  return [
    { label: 'https', kind: CompletionItemKind.EnumMember },
    { label: 'http', kind: CompletionItemKind.EnumMember },
    { label: 'grpc', kind: CompletionItemKind.EnumMember },
    { label: 'tcp', kind: CompletionItemKind.EnumMember },
    { label: 'mtls', kind: CompletionItemKind.EnumMember, detail: 'Mutual TLS' },
    { label: 'kafka', kind: CompletionItemKind.EnumMember },
  ];
}

/**
 * Endpoint type completions
 */
function getEndpointTypeCompletions(): CompletionItem[] {
  return [
    { label: 'api', kind: CompletionItemKind.EnumMember, detail: 'Request-response (REST, GraphQL)' },
    { label: 'events', kind: CompletionItemKind.EnumMember, detail: 'Event-driven (pub/sub)' },
    { label: 'stream', kind: CompletionItemKind.EnumMember, detail: 'Data streaming' },
  ];
}

/**
 * External type completions
 */
function getExternalTypeCompletions(): CompletionItem[] {
  return [
    { label: 'saas', kind: CompletionItemKind.EnumMember, detail: 'SaaS application' },
    { label: 'partner', kind: CompletionItemKind.EnumMember, detail: 'Partner integration' },
    { label: 'enterprise', kind: CompletionItemKind.EnumMember, detail: 'Enterprise system' },
  ];
}

/**
 * User type completions
 */
function getUserTypeCompletions(): CompletionItem[] {
  return [
    { label: 'external', kind: CompletionItemKind.EnumMember, detail: 'External customer' },
    { label: 'internal', kind: CompletionItemKind.EnumMember, detail: 'Internal employee' },
    { label: 'system', kind: CompletionItemKind.EnumMember, detail: 'System/batch process' },
  ];
}

/**
 * Auth completions
 */
function getAuthCompletions(): CompletionItem[] {
  return [
    { label: 'local-sts', kind: CompletionItemKind.EnumMember, detail: 'STS inside the cell' },
    { label: 'federated', kind: CompletionItemKind.EnumMember, detail: 'Federated to external IDP', insertText: 'federated(${1:IdentityProvider})', insertTextFormat: InsertTextFormat.Snippet },
  ];
}

/**
 * All completions (fallback)
 */
function getAllCompletions(state: DocumentState): CompletionItem[] {
  return [
    ...getTopLevelCompletions(),
    ...getCellBodyCompletions(),
    ...getFlowCompletions(state),
  ];
}

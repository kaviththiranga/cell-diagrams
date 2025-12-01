/**
 * Symbol Table
 *
 * Indexes all named entities in a CellDL document for cross-reference features.
 */

import type { Location, Range } from 'vscode-languageserver';
import {
  type Program,
  type Statement,
  type CellDefinition,
  type ComponentDefinition,
  type ClusterDefinition,
  type GatewayDefinition,
  type FlowDefinition,
  type FlowConnection,
  type ExternalDefinition,
  type UserDefinition,
  type ApplicationDefinition,
  type Location as AstLocation,
  isCellDefinition,
  isExternalDefinition,
  isUserDefinition,
  isApplicationDefinition,
  isFlowDefinition,
  isErrorNode,
} from '@cell-diagrams/core';
import { astLocationToRange } from '../documents/position-utils';

/**
 * Symbol kinds in CellDL
 */
export type SymbolKind =
  | 'cell'
  | 'component'
  | 'gateway'
  | 'user'
  | 'external'
  | 'flow'
  | 'cluster'
  | 'application';

/**
 * A symbol in the symbol table
 */
export interface Symbol {
  /** Symbol name/identifier */
  name: string;
  /** Kind of symbol */
  kind: SymbolKind;
  /** Document URI where defined */
  uri: string;
  /** Location of the definition */
  location: Location;
  /** Range of the definition */
  range: Range;
  /** Parent scope (e.g., cell name for components) */
  scope?: string;
  /** Label if different from name */
  label?: string;
  /** Type information (cellType, componentType, etc.) */
  typeInfo?: string;
  /** Description if available */
  description?: string;
  /** All locations where this symbol is referenced */
  references: Location[];
}

/**
 * A reference to a symbol
 */
export interface SymbolReference {
  /** The symbol name being referenced */
  name: string;
  /** Optional scope qualifier (e.g., "CellName" in "CellName.component") */
  scope?: string;
  /** Location of the reference */
  location: Location;
  /** Reference range */
  range: Range;
}

/**
 * Symbol table for a document
 */
export interface SymbolTable {
  /** All symbols indexed by qualified name (scope.name or name) */
  symbols: Map<string, Symbol>;
  /** All references to symbols */
  references: SymbolReference[];
  /** Get symbol by name, optionally within a scope */
  getSymbol(name: string, scope?: string): Symbol | undefined;
  /** Get all symbols in a scope */
  getSymbolsInScope(scope: string): Symbol[];
  /** Get all symbols of a kind */
  getSymbolsByKind(kind: SymbolKind): Symbol[];
  /** Get all references to a symbol */
  getReferences(name: string, scope?: string): Location[];
  /** Find definition of a reference */
  findDefinition(name: string, scope?: string): Location | undefined;
  /** Get all top-level symbols */
  getTopLevelSymbols(): Symbol[];
}

/**
 * Build a symbol table from an AST
 */
export function buildSymbolTable(ast: Program, uri: string): SymbolTable {
  const symbols = new Map<string, Symbol>();
  const references: SymbolReference[] = [];

  // Process all statements
  for (const stmt of ast.statements) {
    processStatement(stmt, uri, symbols, references);
  }

  // Resolve references to symbols
  resolveReferences(symbols, references);

  return {
    symbols,
    references,

    getSymbol(name: string, scope?: string): Symbol | undefined {
      if (scope) {
        return symbols.get(`${scope}.${name}`) ?? symbols.get(name);
      }
      return symbols.get(name);
    },

    getSymbolsInScope(scope: string): Symbol[] {
      const result: Symbol[] = [];
      for (const symbol of symbols.values()) {
        if (symbol.scope === scope) {
          result.push(symbol);
        }
      }
      return result;
    },

    getSymbolsByKind(kind: SymbolKind): Symbol[] {
      const result: Symbol[] = [];
      for (const symbol of symbols.values()) {
        if (symbol.kind === kind) {
          result.push(symbol);
        }
      }
      return result;
    },

    getReferences(name: string, scope?: string): Location[] {
      const qualifiedName = scope ? `${scope}.${name}` : name;
      const symbol = symbols.get(qualifiedName) ?? symbols.get(name);
      return symbol?.references ?? [];
    },

    findDefinition(name: string, scope?: string): Location | undefined {
      const symbol = this.getSymbol(name, scope);
      return symbol?.location;
    },

    getTopLevelSymbols(): Symbol[] {
      const result: Symbol[] = [];
      for (const symbol of symbols.values()) {
        if (!symbol.scope) {
          result.push(symbol);
        }
      }
      return result;
    },
  };
}

/**
 * Process a statement and add symbols
 */
function processStatement(
  stmt: Statement,
  uri: string,
  symbols: Map<string, Symbol>,
  references: SymbolReference[]
): void {
  if (isErrorNode(stmt)) {
    return;
  }

  if (isCellDefinition(stmt)) {
    processCellDefinition(stmt, uri, symbols, references);
  } else if (isExternalDefinition(stmt)) {
    processExternalDefinition(stmt, uri, symbols);
  } else if (isUserDefinition(stmt)) {
    processUserDefinition(stmt, uri, symbols);
  } else if (isApplicationDefinition(stmt)) {
    processApplicationDefinition(stmt, uri, symbols, references);
  } else if (isFlowDefinition(stmt)) {
    processFlowDefinition(stmt, uri, undefined, symbols, references);
  }
}

/**
 * Process a cell definition
 */
function processCellDefinition(
  cell: CellDefinition,
  uri: string,
  symbols: Map<string, Symbol>,
  references: SymbolReference[]
): void {
  const range = cell.location ? astLocationToRange(cell.location) : defaultRange();

  // Add cell symbol
  symbols.set(cell.id, {
    name: cell.id,
    kind: 'cell',
    uri,
    location: { uri, range },
    range,
    label: cell.label,
    typeInfo: cell.cellType,
    description: cell.description,
    references: [],
  });

  // Process gateways
  for (const gateway of cell.gateways) {
    if (!isErrorNode(gateway)) {
      processGatewayDefinition(gateway, cell.id, uri, symbols);
    }
  }

  // Process components
  for (const comp of cell.components) {
    if (isErrorNode(comp)) continue;

    if (comp.type === 'ClusterDefinition') {
      processClusterDefinition(comp as ClusterDefinition, cell.id, uri, symbols);
    } else {
      processComponentDefinition(comp as ComponentDefinition, cell.id, uri, symbols);
    }
  }

  // Process flows within the cell
  for (const flow of cell.flows) {
    if (!isErrorNode(flow)) {
      processFlowDefinition(flow, uri, cell.id, symbols, references);
    }
  }

  // Process nested cells
  for (const nested of cell.nestedCells) {
    if (!isErrorNode(nested)) {
      processCellDefinition(nested, uri, symbols, references);
    }
  }
}

/**
 * Process a gateway definition
 */
function processGatewayDefinition(
  gateway: GatewayDefinition,
  cellId: string,
  uri: string,
  symbols: Map<string, Symbol>
): void {
  const range = gateway.location ? astLocationToRange(gateway.location) : defaultRange();
  const qualifiedName = `${cellId}.${gateway.id}`;

  symbols.set(qualifiedName, {
    name: gateway.id,
    kind: 'gateway',
    uri,
    location: { uri, range },
    range,
    scope: cellId,
    label: gateway.label,
    typeInfo: gateway.direction,
    references: [],
  });
}

/**
 * Process a component definition
 */
function processComponentDefinition(
  component: ComponentDefinition,
  cellId: string,
  uri: string,
  symbols: Map<string, Symbol>
): void {
  const range = component.location ? astLocationToRange(component.location) : defaultRange();
  const qualifiedName = `${cellId}.${component.id}`;

  symbols.set(qualifiedName, {
    name: component.id,
    kind: 'component',
    uri,
    location: { uri, range },
    range,
    scope: cellId,
    typeInfo: component.componentType,
    references: [],
  });
}

/**
 * Process a cluster definition
 */
function processClusterDefinition(
  cluster: ClusterDefinition,
  cellId: string,
  uri: string,
  symbols: Map<string, Symbol>
): void {
  const range = cluster.location ? astLocationToRange(cluster.location) : defaultRange();
  const qualifiedName = `${cellId}.${cluster.id}`;

  symbols.set(qualifiedName, {
    name: cluster.id,
    kind: 'cluster',
    uri,
    location: { uri, range },
    range,
    scope: cellId,
    typeInfo: cluster.clusterType,
    references: [],
  });

  // Process components in cluster
  for (const comp of cluster.components) {
    processComponentDefinition(comp, cellId, uri, symbols);
  }
}

/**
 * Process an external definition
 */
function processExternalDefinition(
  ext: ExternalDefinition,
  uri: string,
  symbols: Map<string, Symbol>
): void {
  const range = ext.location ? astLocationToRange(ext.location) : defaultRange();

  symbols.set(ext.id, {
    name: ext.id,
    kind: 'external',
    uri,
    location: { uri, range },
    range,
    label: ext.label,
    typeInfo: ext.externalType,
    references: [],
  });
}

/**
 * Process a user definition
 */
function processUserDefinition(
  user: UserDefinition,
  uri: string,
  symbols: Map<string, Symbol>
): void {
  const range = user.location ? astLocationToRange(user.location) : defaultRange();

  symbols.set(user.id, {
    name: user.id,
    kind: 'user',
    uri,
    location: { uri, range },
    range,
    label: user.label,
    typeInfo: user.userType,
    references: [],
  });
}

/**
 * Process an application definition
 */
function processApplicationDefinition(
  app: ApplicationDefinition,
  uri: string,
  symbols: Map<string, Symbol>,
  references: SymbolReference[]
): void {
  const range = app.location ? astLocationToRange(app.location) : defaultRange();

  symbols.set(app.id, {
    name: app.id,
    kind: 'application',
    uri,
    location: { uri, range },
    range,
    label: app.label,
    references: [],
  });

  // Cell references in application.cells
  for (const cellId of app.cells) {
    references.push({
      name: cellId,
      location: { uri, range }, // Ideally would be the specific cell reference location
      range,
    });
  }
}

/**
 * Process a flow definition
 */
function processFlowDefinition(
  flow: FlowDefinition,
  uri: string,
  scope: string | undefined,
  symbols: Map<string, Symbol>,
  references: SymbolReference[]
): void {
  if (flow.name) {
    const range = flow.location ? astLocationToRange(flow.location) : defaultRange();
    const qualifiedName = scope ? `${scope}.${flow.name}` : flow.name;

    symbols.set(qualifiedName, {
      name: flow.name,
      kind: 'flow',
      uri,
      location: { uri, range },
      range,
      scope,
      references: [],
    });
  }

  // Process flow connections as references
  for (const conn of flow.flows) {
    processFlowConnection(conn, uri, scope, references);
  }
}

/**
 * Process a flow connection and extract references
 */
function processFlowConnection(
  conn: FlowConnection,
  uri: string,
  scope: string | undefined,
  references: SymbolReference[]
): void {
  const range = conn.location ? astLocationToRange(conn.location) : defaultRange();

  // Parse source reference (may be "CellName.componentName" or just "componentName")
  const sourceRef = parseReference(conn.source, scope);
  references.push({
    ...sourceRef,
    location: { uri, range },
    range,
  });

  // Parse destination reference
  const destRef = parseReference(conn.destination, scope);
  references.push({
    ...destRef,
    location: { uri, range },
    range,
  });
}

/**
 * Parse a reference string into name and optional scope
 */
function parseReference(
  ref: string,
  defaultScope?: string
): { name: string; scope?: string } {
  const parts = ref.split('.');
  if (parts.length === 2) {
    return { name: parts[1]!, scope: parts[0] };
  }
  return { name: ref, scope: defaultScope };
}

/**
 * Resolve references to symbols and update symbol.references
 */
function resolveReferences(
  symbols: Map<string, Symbol>,
  references: SymbolReference[]
): void {
  for (const ref of references) {
    // Try qualified name first
    const qualifiedName = ref.scope ? `${ref.scope}.${ref.name}` : ref.name;
    let symbol = symbols.get(qualifiedName);

    // Fall back to unqualified name
    if (!symbol) {
      symbol = symbols.get(ref.name);
    }

    if (symbol) {
      symbol.references.push(ref.location);
    }
  }
}

/**
 * Default range for nodes without location info
 */
function defaultRange(): Range {
  return {
    start: { line: 0, character: 0 },
    end: { line: 0, character: 0 },
  };
}

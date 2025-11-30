/**
 * Cell Diagrams Stringify
 *
 * Converts an AST back to Cell Diagrams DSL source code.
 * Updated for new Cell-Based Architecture DSL.
 */

import {
  Program,
  Statement,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  ConnectionsBlock,
  Connection,
  ComponentDefinition,
  ClusterDefinition,
  GatewayDefinition,
  ConnectionEndpoint,
  AttributeValue,
  isClusterDefinition,
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

  // Optional diagram wrapper
  if (ast.name) {
    lines.push(`diagram "${escapeString(ast.name)}" {`);
    for (const stmt of ast.statements) {
      const stmtStr = stringifyStatement(stmt, opts, 1);
      lines.push(stmtStr);
      if (opts.blankLinesBetweenStatements) {
        lines.push('');
      }
    }
    // Remove trailing blank line
    if (opts.blankLinesBetweenStatements && lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    lines.push('}');
  } else {
    for (const stmt of ast.statements) {
      lines.push(stringifyStatement(stmt, opts, 0));
      if (opts.blankLinesBetweenStatements) {
        lines.push('');
      }
    }
    // Remove trailing blank line
    if (opts.blankLinesBetweenStatements && lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
  }

  return lines.join(opts.lineEnding).trim() + opts.lineEnding;
}

// ============================================
// Statement Stringifiers
// ============================================

function stringifyStatement(
  stmt: Statement,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  switch (stmt.type) {
    case 'CellDefinition':
      return stringifyCellDefinition(stmt, opts, baseIndent);
    case 'ExternalDefinition':
      return stringifyExternalDefinition(stmt, opts, baseIndent);
    case 'UserDefinition':
      return stringifyUserDefinition(stmt, opts, baseIndent);
    case 'ApplicationDefinition':
      return stringifyApplicationDefinition(stmt, opts, baseIndent);
    case 'ConnectionsBlock':
      return stringifyConnectionsBlock(stmt, opts, baseIndent);
    default:
      return '';
  }
}

function stringifyCellDefinition(
  cell: CellDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const i2 = indent.repeat(baseIndent + 2);
  const lines: string[] = [];

  lines.push(`${i0}cell ${cell.id} {`);

  // Label property
  if (cell.label) {
    lines.push(`${i1}label: "${escapeString(cell.label)}"`);
  }

  // Type property
  lines.push(`${i1}type: ${cell.cellType}`);

  // Gateway block
  if (cell.gateway) {
    lines.push('');
    lines.push(stringifyGateway(cell.gateway, opts, baseIndent + 1));
  }

  // Components block
  if (cell.components.length > 0) {
    lines.push('');
    lines.push(`${i1}components {`);
    for (const comp of cell.components) {
      if (isClusterDefinition(comp)) {
        lines.push(stringifyCluster(comp, opts, baseIndent + 2));
      } else {
        lines.push(`${i2}${stringifyComponent(comp)}`);
      }
    }
    lines.push(`${i1}}`);
  }

  // Internal connections block
  if (cell.connections.length > 0) {
    lines.push('');
    lines.push(`${i1}connections {`);
    for (const conn of cell.connections) {
      lines.push(`${i2}${conn.source} -> ${conn.target}`);
    }
    lines.push(`${i1}}`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyGateway(
  gateway: GatewayDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  // If gateway has an explicit ID that's not 'gateway', include it
  const gatewayId = gateway.id && gateway.id !== 'gateway' ? ` ${gateway.id}` : '';
  lines.push(`${i0}gateway${gatewayId} {`);

  // Label property
  if (gateway.label) {
    lines.push(`${i1}label: "${escapeString(gateway.label)}"`);
  }

  if (gateway.exposes.length > 0) {
    lines.push(`${i1}exposes: [${gateway.exposes.join(', ')}]`);
  }

  if (gateway.policies && gateway.policies.length > 0) {
    lines.push(`${i1}policies: [${gateway.policies.join(', ')}]`);
  }

  if (gateway.auth) {
    if (gateway.auth.authType === 'local-sts') {
      lines.push(`${i1}auth: local-sts`);
    } else if (gateway.auth.reference) {
      lines.push(`${i1}auth: federated(${gateway.auth.reference})`);
    }
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyCluster(
  cluster: ClusterDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  lines.push(`${i0}cluster ${cluster.id} {`);

  if (cluster.clusterType) {
    lines.push(`${i1}type: ${cluster.clusterType}`);
  }

  if (cluster.replicas !== undefined) {
    lines.push(`${i1}replicas: ${cluster.replicas}`);
  }

  for (const comp of cluster.components) {
    lines.push(`${i1}${stringifyComponent(comp)}`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyComponent(comp: ComponentDefinition): string {
  const attrs = stringifyAttributes(comp.attributes, comp.sidecars);
  return `${comp.componentType} ${comp.id}${attrs}`;
}

function stringifyExternalDefinition(
  ext: ExternalDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  lines.push(`${i0}external ${ext.id} {`);

  if (ext.label) {
    lines.push(`${i1}label: "${escapeString(ext.label)}"`);
  }

  lines.push(`${i1}type: ${ext.externalType}`);

  if (ext.provides && ext.provides.length > 0) {
    lines.push(`${i1}provides: [${ext.provides.join(', ')}]`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyUserDefinition(
  user: UserDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  lines.push(`${i0}user ${user.id} {`);

  if (user.label) {
    lines.push(`${i1}label: "${escapeString(user.label)}"`);
  }

  lines.push(`${i1}type: ${user.userType}`);

  if (user.channels && user.channels.length > 0) {
    lines.push(`${i1}channels: [${user.channels.join(', ')}]`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyApplicationDefinition(
  app: ApplicationDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  lines.push(`${i0}application ${app.id} {`);

  if (app.label) {
    lines.push(`${i1}label: "${escapeString(app.label)}"`);
  }

  if (app.version) {
    lines.push(`${i1}version: "${escapeString(app.version)}"`);
  }

  if (app.cells.length > 0) {
    lines.push(`${i1}cells: [${app.cells.join(', ')}]`);
  }

  if (app.gateway) {
    lines.push('');
    lines.push(stringifyGateway(app.gateway, opts, baseIndent + 1));
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyConnectionsBlock(
  block: ConnectionsBlock,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  lines.push(`${i0}connections {`);

  for (const conn of block.connections) {
    lines.push(`${i1}${stringifyConnection(conn)}`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyConnection(conn: Connection): string {
  const direction = conn.direction ? `${conn.direction} ` : '';
  const source = stringifyEndpoint(conn.source);
  const target = stringifyEndpoint(conn.target);
  const attrs = stringifyAttributes(conn.attributes);
  return `${direction}${source} -> ${target}${attrs}`;
}

function stringifyEndpoint(ep: ConnectionEndpoint): string {
  if (ep.component) {
    return `${ep.entity}.${ep.component}`;
  }
  return ep.entity;
}

// ============================================
// Utility Functions
// ============================================

function stringifyAttributes(
  attrs: Record<string, AttributeValue>,
  sidecars?: string[]
): string {
  const entries = Object.entries(attrs);

  // Add sidecars to attributes if present
  if (sidecars && sidecars.length > 0) {
    entries.push(['sidecar', sidecars]);
  }

  if (entries.length === 0) return '';

  const parts = entries.map(([key, value]) => {
    return `${key}: ${stringifyValue(value)}`;
  });

  return ` { ${parts.join(', ')} }`;
}

function stringifyValue(value: AttributeValue): string {
  if (typeof value === 'string') {
    // Check if it needs quoting (contains spaces or special chars)
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value)) {
      return value;
    }
    return `"${escapeString(value)}"`;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const items = value.map(v => stringifyValue(v));
    return `[${items.join(', ')}]`;
  }
  return String(value);
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

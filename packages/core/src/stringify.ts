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

  for (const stmt of ast.statements) {
    lines.push(stringifyStatement(stmt, opts));

    // Add blank line between statements
    if (opts.blankLinesBetweenStatements) {
      lines.push('');
    }
  }

  // Remove trailing blank line if added
  if (opts.blankLinesBetweenStatements && lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
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

/**
 * CellDL Stringify
 *
 * Converts an AST back to CellDL (Cell Definition Language) source code.
 * Supports new workspace/flow/route syntax.
 */

import {
  Program,
  Statement,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  ComponentDefinition,
  ClusterDefinition,
  GatewayDefinition,
  AttributeValue,
  FlowDefinition,
  FlowConnection,
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
 * Convert an AST back to CellDL source code.
 *
 * @param ast - The AST to stringify
 * @param options - Formatting options
 * @returns The formatted CellDL source code
 */
export function stringify(ast: Program, options: StringifyOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  const lines: string[] = [];

  // Workspace wrapper (new CellDL syntax)
  if (ast.name) {
    lines.push(`workspace "${escapeString(ast.name)}" {`);

    // Version
    if (ast.version) {
      lines.push(`${opts.indent}version "${escapeString(ast.version)}"`);
    }

    // Description
    if (ast.description) {
      lines.push(`${opts.indent}description "${escapeString(ast.description)}"`);
    }

    // Properties
    for (const prop of ast.properties) {
      lines.push(`${opts.indent}property ${prop.key} = "${escapeString(prop.value)}"`);
    }

    if (ast.version || ast.description || ast.properties.length > 0) {
      lines.push('');
    }

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
    case 'FlowDefinition':
      return stringifyFlowDefinition(stmt, opts, baseIndent);
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
  const lines: string[] = [];

  // New CellDL syntax: cell "Name" type:TYPE { }
  const label = cell.label ? `"${escapeString(cell.label)}"` : `"${cell.id}"`;
  lines.push(`${i0}cell ${label} type:${cell.cellType} {`);

  // Description
  if (cell.description) {
    lines.push(`${i1}description "${escapeString(cell.description)}"`);
  }

  // Replicas
  if (cell.replicas !== undefined) {
    lines.push(`${i1}replicas ${cell.replicas}`);
  }

  // Gateways (new multi-gateway syntax)
  for (const gw of cell.gateways) {
    lines.push('');
    lines.push(stringifyGateway(gw, opts, baseIndent + 1));
  }

  // Legacy single gateway
  if (cell.gateway && cell.gateways.length === 0) {
    lines.push('');
    lines.push(stringifyGateway(cell.gateway, opts, baseIndent + 1));
  }

  // Components
  for (const comp of cell.components) {
    lines.push('');
    if (isClusterDefinition(comp)) {
      lines.push(stringifyCluster(comp, opts, baseIndent + 1));
    } else {
      lines.push(stringifyComponentBlock(comp, opts, baseIndent + 1));
    }
  }

  // Internal flows
  for (const flow of cell.flows) {
    lines.push('');
    lines.push(stringifyFlowDefinition(flow, opts, baseIndent + 1));
  }

  // Nested cells
  for (const nestedCell of cell.nestedCells) {
    lines.push('');
    lines.push(stringifyCellDefinition(nestedCell, opts, baseIndent + 1));
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

  // New CellDL syntax: gateway ingress/egress "id" { }
  const direction = gateway.direction || 'ingress';
  const gatewayId = gateway.id && gateway.id !== 'gateway' ? ` "${gateway.id}"` : '';
  lines.push(`${i0}gateway ${direction}${gatewayId} {`);

  // Protocol
  if (gateway.protocol) {
    lines.push(`${i1}protocol ${gateway.protocol}`);
  }

  // Port
  if (gateway.port !== undefined) {
    lines.push(`${i1}port ${gateway.port}`);
  }

  // Context path
  if (gateway.context) {
    lines.push(`${i1}context "${escapeString(gateway.context)}"`);
  }

  // Target (for egress)
  if (gateway.target) {
    lines.push(`${i1}target "${escapeString(gateway.target)}"`);
  }

  // Policy (single for egress)
  if (gateway.policy) {
    lines.push(`${i1}policy ${gateway.policy}`);
  }

  // Auth
  if (gateway.auth) {
    if (gateway.auth.authType === 'local-sts') {
      lines.push(`${i1}auth local-sts`);
    } else if (gateway.auth.reference) {
      lines.push(`${i1}auth federated(${gateway.auth.reference})`);
    }
  }

  // Exposes (for ingress)
  if (gateway.exposes.length > 0) {
    lines.push(`${i1}exposes [${gateway.exposes.join(', ')}]`);
  }

  // Policies (multiple)
  if (gateway.policies && gateway.policies.length > 0) {
    lines.push(`${i1}policies [${gateway.policies.join(', ')}]`);
  }

  // Routes
  for (const route of gateway.routes) {
    lines.push(`${i1}route "${route.path}" -> ${route.target}`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyComponentBlock(
  comp: ComponentDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  // Determine block type based on component type
  const blockType = getComponentBlockType(comp.componentType);
  lines.push(`${i0}${blockType} "${comp.id}" {`);

  // Source (Docker image)
  if (comp.source) {
    lines.push(`${i1}source "${escapeString(comp.source)}"`);
  }

  // Port
  if (comp.port !== undefined) {
    lines.push(`${i1}port ${comp.port}`);
  }

  // Database-specific fields
  if (comp.engine) {
    lines.push(`${i1}engine ${comp.engine}`);
  }
  if (comp.storage) {
    lines.push(`${i1}storage ${comp.storage}`);
  }
  if (comp.version) {
    lines.push(`${i1}version "${escapeString(comp.version)}"`);
  }

  // Environment variables
  if (comp.env && comp.env.length > 0) {
    lines.push(`${i1}env {`);
    for (const envVar of comp.env) {
      lines.push(`${indent.repeat(baseIndent + 2)}${envVar.key} = "${escapeString(envVar.value)}"`);
    }
    lines.push(`${i1}}`);
  }

  // Other attributes
  const attrEntries = Object.entries(comp.attributes).filter(
    ([key]) => !['tech', 'replicas'].includes(key) || comp.source === undefined
  );
  for (const [key, value] of attrEntries) {
    lines.push(`${i1}${key} ${stringifyValue(value)}`);
  }

  // Sidecars
  if (comp.sidecars && comp.sidecars.length > 0) {
    lines.push(`${i1}sidecars [${comp.sidecars.join(', ')}]`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function getComponentBlockType(componentType: string): string {
  switch (componentType) {
    case 'database':
      return 'database';
    case 'function':
      return 'function';
    case 'legacy':
      return 'legacy';
    default:
      return 'component';
  }
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

  lines.push(`${i0}cluster "${cluster.id}" {`);

  if (cluster.clusterType) {
    lines.push(`${i1}type ${cluster.clusterType}`);
  }

  if (cluster.replicas !== undefined) {
    lines.push(`${i1}replicas ${cluster.replicas}`);
  }

  for (const comp of cluster.components) {
    lines.push('');
    lines.push(stringifyComponentBlock(comp, opts, baseIndent + 1));
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

function stringifyFlowDefinition(
  flow: FlowDefinition,
  opts: Required<StringifyOptions>,
  baseIndent: number
): string {
  const { indent, lineEnding } = opts;
  const i0 = indent.repeat(baseIndent);
  const i1 = indent.repeat(baseIndent + 1);
  const lines: string[] = [];

  const flowName = flow.name ? ` "${escapeString(flow.name)}"` : '';
  lines.push(`${i0}flow${flowName} {`);

  // Group flows into chains where possible
  const chains = groupFlowsIntoChains(flow.flows);
  for (const chain of chains) {
    const chainStr = chain.refs.join(' -> ');
    const labelStr = chain.label ? ` : "${escapeString(chain.label)}"` : '';
    lines.push(`${i1}${chainStr}${labelStr}`);
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

interface FlowChain {
  refs: string[];
  label?: string | undefined;
}

function groupFlowsIntoChains(flows: FlowConnection[]): FlowChain[] {
  if (flows.length === 0) return [];

  const chains: FlowChain[] = [];
  const used = new Set<number>();

  for (let i = 0; i < flows.length; i++) {
    if (used.has(i)) continue;

    const chain: string[] = [flows[i]!.source, flows[i]!.destination];
    let lastLabel = flows[i]!.label;
    used.add(i);

    // Try to extend the chain
    let extended = true;
    while (extended) {
      extended = false;
      for (let j = 0; j < flows.length; j++) {
        if (used.has(j)) continue;
        if (flows[j]!.source === chain[chain.length - 1]) {
          chain.push(flows[j]!.destination);
          lastLabel = flows[j]!.label;
          used.add(j);
          extended = true;
          break;
        }
      }
    }

    chains.push({ refs: chain, label: lastLabel });
  }

  return chains;
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

  const label = ext.label ? `"${escapeString(ext.label)}"` : `"${ext.id}"`;
  lines.push(`${i0}external ${label} type:${ext.externalType} {`);

  if (ext.provides && ext.provides.length > 0) {
    lines.push(`${i1}provides [${ext.provides.join(', ')}]`);
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

  const label = user.label ? `"${escapeString(user.label)}"` : `"${user.id}"`;
  lines.push(`${i0}user ${label} type:${user.userType} {`);

  if (user.channels && user.channels.length > 0) {
    lines.push(`${i1}channels [${user.channels.join(', ')}]`);
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

  const label = app.label ? `"${escapeString(app.label)}"` : `"${app.id}"`;
  lines.push(`${i0}application ${label} {`);

  if (app.version) {
    lines.push(`${i1}version "${escapeString(app.version)}"`);
  }

  if (app.cells.length > 0) {
    lines.push(`${i1}cells [${app.cells.join(', ')}]`);
  }

  if (app.gateway) {
    lines.push('');
    lines.push(stringifyGateway(app.gateway, opts, baseIndent + 1));
  }

  lines.push(`${i0}}`);

  return lines.join(lineEnding);
}

// ============================================
// Utility Functions
// ============================================

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

/**
 * AST to Diagram Converter - Minimalist Excalidraw-style
 *
 * Converts a Cell Diagrams AST into React Flow nodes and edges.
 * Components and gateways are rendered as individual circular nodes.
 */

import type { MarkerType } from '@xyflow/react';
import type {
  Program,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  ConnectionsBlock,
  Connection,
  ComponentDefinition,
  ClusterDefinition,
} from '@cell-diagrams/core';
import type {
  DiagramNode,
  DiagramEdge,
  DiagramState,
  CellNodeData,
  ExternalNodeData,
  UserNodeData,
  ApplicationNodeData,
  ComponentNodeData,
  ClusterNodeData,
  GatewayNodeData,
  ConnectionEdgeData,
  LayoutOptions,
} from './types';
import { defaultLayoutOptions } from './types';
import type { ComponentNodeData as ComponentNodeDataType } from './nodes/ComponentNode';
import type { GatewayNodeData as GatewayNodeDataType, GatewayPosition } from './nodes/GatewayNode';

// ============================================
// Layout Constants for Minimalist Design
// ============================================

const CELL_PADDING = 60;
const COMPONENT_SPACING = 100;
const GATEWAY_OFFSET = 30;

// ============================================
// AST to Diagram Conversion
// ============================================

/**
 * Convert a Cell Diagrams AST to React Flow nodes and edges.
 * This creates individual nodes for cells, components, gateways, etc.
 */
export function astToDiagram(ast: Program): DiagramState {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Track cell positions for layout
  let cellIndex = 0;

  // Process all statements
  for (const stmt of ast.statements) {
    switch (stmt.type) {
      case 'CellDefinition': {
        const cellNodes = cellToNodes(stmt, cellIndex);
        nodes.push(...cellNodes.nodes);
        edges.push(...cellNodes.edges);
        cellIndex++;
        break;
      }
      case 'ExternalDefinition':
        nodes.push(externalToNode(stmt));
        break;
      case 'UserDefinition':
        nodes.push(userToNode(stmt));
        break;
      case 'ApplicationDefinition':
        nodes.push(applicationToNode(stmt));
        break;
      case 'ConnectionsBlock':
        edges.push(...connectionsBlockToEdges(stmt));
        break;
    }
  }

  return { nodes, edges };
}

/**
 * Convert a CellDefinition to multiple React Flow nodes:
 * - One cell boundary node
 * - One gateway node (if present)
 * - Individual component nodes
 */
function cellToNodes(
  cell: CellDefinition,
  _cellIndex: number
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Collect all components (including from clusters)
  const allComponents: ComponentDefinition[] = [...cell.components.filter(
    (c): c is ComponentDefinition => c.type === 'ComponentDefinition'
  )];

  const clusters = cell.components.filter(
    (c): c is ClusterDefinition => c.type === 'ClusterDefinition'
  );

  for (const cluster of clusters) {
    allComponents.push(...cluster.components);
  }

  // Calculate cell size based on components
  // For a regular octagon with equal sides, we want the cell to be square
  const componentCount = allComponents.length;
  const cols = Math.ceil(Math.sqrt(componentCount + 1)); // +1 for gateway space
  const rows = Math.ceil((componentCount + 1) / cols);
  const baseWidth = cols * COMPONENT_SPACING + CELL_PADDING * 2;
  const baseHeight = rows * COMPONENT_SPACING + CELL_PADDING * 2 + 40; // +40 for label
  // Make it square by using the max dimension for a proper regular octagon
  const cellSize = Math.max(baseWidth, baseHeight);
  const cellWidth = cellSize;
  const cellHeight = cellSize;

  // Create cell boundary node
  const cellData: CellNodeData = {
    type: 'cell',
    id: cell.id,
    label: cell.label ?? cell.id,
    cellType: cell.cellType,
    gateway: cell.gateway
      ? {
          id: cell.gateway.id,
          exposes: cell.gateway.exposes,
          policies: cell.gateway.policies,
          hasAuth: !!cell.gateway.auth,
          authType: cell.gateway.auth?.authType,
        }
      : undefined,
    components: allComponents.map(componentToNodeData),
    clusters: clusters.map(clusterToNodeData),
    internalConnections: cell.connections.map((conn) => ({
      source: conn.source,
      target: conn.target,
    })),
    width: cellWidth,
    height: cellHeight,
  };

  nodes.push({
    id: cell.id,
    type: 'cell',
    position: { x: 0, y: 0 },
    data: cellData,
    // Cell should be behind other nodes
    zIndex: -1,
  } as DiagramNode);

  // Create gateway node if present - positioned ON the cell boundary
  // Gateways are NOT children of the cell so they can overlap the boundary
  if (cell.gateway) {
    // Determine gateway position - default to north (top), but can be overridden
    const gatewayPosition: GatewayPosition = (cell.gateway.position as GatewayPosition) ?? 'north';

    // Determine gateway type from label or position
    let gatewayType: 'external' | 'internal' | 'egress' = 'external';
    const labelLower = (cell.gateway.label ?? '').toLowerCase();
    if (labelLower.includes('internal') || gatewayPosition === 'west') {
      gatewayType = 'internal';
    } else if (labelLower.includes('egress') || gatewayPosition === 'south') {
      gatewayType = 'egress';
    }

    const gatewayData: GatewayNodeDataType = {
      type: 'gateway',
      id: cell.gateway.id,
      label: cell.gateway.label ?? cell.gateway.id,
      gatewayType,
      position: gatewayPosition,
      parentCell: cell.id,
      exposes: cell.gateway.exposes,
      policies: cell.gateway.policies ?? [],
      hasAuth: !!cell.gateway.auth,
      ...(cell.gateway.auth?.authType ? { authType: cell.gateway.auth.authType } : {}),
    };

    // Calculate position on cell boundary based on gateway position
    // For octagon, we position at the center of each side
    const gatewaySize = 45; // Size of gateway node
    let gwX = cellWidth / 2 - gatewaySize / 2;
    let gwY = -gatewaySize / 2; // Default: north (top edge)

    switch (gatewayPosition) {
      case 'north':
        gwX = cellWidth / 2 - gatewaySize / 2;
        gwY = -gatewaySize / 2;
        break;
      case 'south':
        gwX = cellWidth / 2 - gatewaySize / 2;
        gwY = cellHeight - gatewaySize / 2;
        break;
      case 'east':
        gwX = cellWidth - gatewaySize / 2;
        gwY = cellHeight / 2 - gatewaySize / 2;
        break;
      case 'west':
        gwX = -gatewaySize / 2;
        gwY = cellHeight / 2 - gatewaySize / 2;
        break;
    }

    nodes.push({
      id: `${cell.id}.gateway`,
      type: 'gateway',
      position: { x: gwX, y: gwY },
      data: gatewayData,
      parentId: cell.id,
      // Don't use extent: 'parent' so gateway can overlap boundary
    } as unknown as DiagramNode);
  }

  // Create component nodes positioned inside cell
  let compIndex = 0;
  const startY = cell.gateway ? COMPONENT_SPACING + GATEWAY_OFFSET : CELL_PADDING;

  for (const comp of allComponents) {
    const col = compIndex % cols;
    const row = Math.floor(compIndex / cols);

    const compData: ComponentNodeDataType = {
      type: 'component',
      id: comp.id,
      label: comp.id,
      componentType: comp.componentType,
      parentCell: cell.id,
      attributes: comp.attributes,
      sidecars: comp.sidecars ?? [],
    };

    nodes.push({
      id: `${cell.id}.${comp.id}`,
      type: 'component',
      position: {
        x: CELL_PADDING + col * COMPONENT_SPACING,
        y: startY + row * COMPONENT_SPACING,
      },
      data: compData,
      parentId: cell.id,
      extent: 'parent',
    } as unknown as DiagramNode);

    compIndex++;
  }

  // Create edges for internal connections
  for (const conn of cell.connections) {
    edges.push({
      id: `${cell.id}.${conn.source}-${conn.target}`,
      source: `${cell.id}.${conn.source}`,
      target: `${cell.id}.${conn.target}`,
      type: 'smoothstep',
      style: { stroke: '#868e96', strokeWidth: 1.5 },
      markerEnd: {
        type: 'arrowclosed' as MarkerType,
        width: 15,
        height: 15,
        color: '#868e96',
      },
    });
  }

  return { nodes, edges };
}

/**
 * Convert a ComponentDefinition to ComponentNodeData.
 */
function componentToNodeData(comp: ComponentDefinition): ComponentNodeData {
  return {
    id: comp.id,
    label: comp.id,
    componentType: comp.componentType,
    attributes: comp.attributes,
    sidecars: comp.sidecars,
  };
}

/**
 * Convert a ClusterDefinition to ClusterNodeData.
 */
function clusterToNodeData(cluster: ClusterDefinition): ClusterNodeData {
  return {
    id: cluster.id,
    clusterType: cluster.clusterType,
    replicas: cluster.replicas,
    components: cluster.components.map(componentToNodeData),
  };
}

/**
 * Convert an ExternalDefinition to a React Flow node.
 */
function externalToNode(external: ExternalDefinition): DiagramNode {
  const data: ExternalNodeData = {
    type: 'external',
    id: external.id,
    label: external.label ?? external.id,
    externalType: external.externalType,
    provides: external.provides,
  };

  return {
    id: external.id,
    type: 'external',
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Convert a UserDefinition to a React Flow node.
 */
function userToNode(user: UserDefinition): DiagramNode {
  const data: UserNodeData = {
    type: 'user',
    id: user.id,
    label: user.label ?? user.id,
    userType: user.userType,
    channels: user.channels,
  };

  return {
    id: user.id,
    type: 'user',
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Convert an ApplicationDefinition to a React Flow node.
 */
function applicationToNode(app: ApplicationDefinition): DiagramNode {
  let gateway: GatewayNodeData | undefined;
  if (app.gateway) {
    gateway = {
      id: app.gateway.id,
      exposes: app.gateway.exposes,
      policies: app.gateway.policies,
      hasAuth: !!app.gateway.auth,
      authType: app.gateway.auth?.authType,
    };
  }

  const data: ApplicationNodeData = {
    type: 'application',
    id: app.id,
    label: app.label ?? app.id,
    version: app.version,
    cells: app.cells,
    gateway,
  };

  return {
    id: app.id,
    type: 'application',
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Convert a ConnectionsBlock to React Flow edges.
 */
function connectionsBlockToEdges(block: ConnectionsBlock): DiagramEdge[] {
  return block.connections.map(connectionToEdge);
}

/**
 * Convert a Connection to a React Flow edge.
 */
function connectionToEdge(conn: Connection): DiagramEdge {
  // Extract common attributes
  const label = conn.attributes['label'];
  const via = conn.attributes['via'];
  const protocol = conn.attributes['protocol'];

  const data: ConnectionEdgeData = {
    direction: conn.direction,
    label: typeof label === 'string' ? label : undefined,
    via: typeof via === 'string' ? via : undefined,
    protocol: typeof protocol === 'string' ? protocol : undefined,
    attributes: conn.attributes,
  };

  // Build source/target IDs
  // If component is specified, point to the component node
  const sourceId = conn.source.component
    ? `${conn.source.entity}.${conn.source.component}`
    : conn.source.entity;
  const targetId = conn.target.component
    ? `${conn.target.entity}.${conn.target.component}`
    : conn.target.entity;

  // Determine handle IDs based on direction
  // Direction indicates how traffic flows from the source's perspective:
  // - northbound: from south to north (source uses bottom, target uses top)
  // - southbound: from north to south (source uses bottom, target uses top)
  // - eastbound: from west to east (source uses right, target uses left)
  // - westbound: from east to west (source uses left, target uses right)
  let sourceHandle: string | null = null;
  let targetHandle: string | null = null;

  switch (conn.direction) {
    case 'northbound':
      sourceHandle = 'bottom';
      targetHandle = 'top';
      break;
    case 'southbound':
      sourceHandle = 'bottom';
      targetHandle = 'top';
      break;
    case 'eastbound':
      sourceHandle = 'right';
      targetHandle = 'left';
      break;
    case 'westbound':
      sourceHandle = 'left';
      targetHandle = 'right';
      break;
    default:
      // No direction specified - let React Flow auto-determine
      sourceHandle = null;
      targetHandle = null;
  }

  // Determine edge style based on direction
  const isDotted = !conn.direction || conn.direction === 'westbound';

  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    type: 'smoothstep',
    style: {
      stroke: '#868e96',
      strokeWidth: 1.5,
      strokeDasharray: isDotted ? '5,5' : undefined,
    },
    data,
    markerEnd: {
      type: 'arrowclosed' as MarkerType,
      width: 15,
      height: 15,
      color: '#868e96',
    },
  };
}

// ============================================
// Layout with Custom Algorithm
// ============================================

/**
 * Apply automatic layout to nodes.
 * Uses a simple algorithm that positions cells in a grid,
 * with users at top and externals at bottom.
 */
export function applyLayout(
  state: DiagramState,
  options: LayoutOptions = {}
): DiagramState {
  const opts = { ...defaultLayoutOptions, ...options };

  // Separate nodes by type
  const cells = state.nodes.filter((n) => n.type === 'cell');
  const users = state.nodes.filter((n) => n.type === 'user');
  const externals = state.nodes.filter((n) => n.type === 'external');
  const applications = state.nodes.filter((n) => n.type === 'application');
  // Components and gateways are positioned relative to their parent cells

  const layoutedNodes: DiagramNode[] = [];

  // Layout users at the top
  let userX = opts.padding;
  for (const user of users) {
    layoutedNodes.push({
      ...user,
      position: { x: userX, y: opts.padding },
    });
    userX += 150 + opts.nodeSpacingX;
  }

  // Layout cells in a grid
  const cellsPerRow = Math.ceil(Math.sqrt(cells.length));
  let cellX = opts.padding;
  let cellY = users.length > 0 ? 150 + opts.nodeSpacingY : opts.padding;
  let maxCellHeight = 0;
  let cellCol = 0;

  for (const cell of cells) {
    const cellData = cell.data as CellNodeData;
    const cellWidth = cellData.width ?? 400;
    const cellHeight = cellData.height ?? 300;

    layoutedNodes.push({
      ...cell,
      position: { x: cellX, y: cellY },
    });

    maxCellHeight = Math.max(maxCellHeight, cellHeight);
    cellX += cellWidth + opts.nodeSpacingX;
    cellCol++;

    if (cellCol >= cellsPerRow) {
      cellCol = 0;
      cellX = opts.padding;
      cellY += maxCellHeight + opts.nodeSpacingY;
      maxCellHeight = 0;
    }
  }

  // Layout externals at the bottom
  const bottomY = cellY + maxCellHeight + opts.nodeSpacingY;
  let extX = opts.padding + 200; // Center under cells
  for (const ext of externals) {
    layoutedNodes.push({
      ...ext,
      position: { x: extX, y: bottomY },
    });
    extX += 150 + opts.nodeSpacingX;
  }

  // Layout applications (if any)
  for (const app of applications) {
    layoutedNodes.push({
      ...app,
      position: { x: opts.padding, y: opts.padding },
    });
  }

  // Add child nodes (components and gateways) - they use relative positioning
  const childNodes = state.nodes.filter(
    (n) => n.type === 'component' || n.type === 'gateway'
  );
  layoutedNodes.push(...childNodes);

  return {
    nodes: layoutedNodes,
    edges: state.edges,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Find a node by ID.
 */
export function findNode(
  nodes: DiagramNode[],
  id: string
): DiagramNode | undefined {
  return nodes.find((n) => n.id === id);
}

/**
 * Find edges connected to a node.
 */
export function findConnectedEdges(
  edges: DiagramEdge[],
  nodeId: string
): DiagramEdge[] {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

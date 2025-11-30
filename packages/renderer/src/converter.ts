/**
 * AST to Diagram Converter
 *
 * Converts a Cell Diagrams AST into React Flow nodes and edges.
 * Updated for Cell-Based Architecture DSL.
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
import dagre from 'dagre';

// ============================================
// AST to Diagram Conversion
// ============================================

/**
 * Convert a Cell Diagrams AST to React Flow nodes and edges.
 */
export function astToDiagram(ast: Program): DiagramState {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Process all statements
  for (const stmt of ast.statements) {
    switch (stmt.type) {
      case 'CellDefinition':
        nodes.push(cellToNode(stmt));
        break;
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
 * Convert a CellDefinition to a React Flow node.
 */
function cellToNode(cell: CellDefinition): DiagramNode {
  const components: ComponentNodeData[] = [];
  const clusters: ClusterNodeData[] = [];

  for (const item of cell.components) {
    if (item.type === 'ClusterDefinition') {
      clusters.push(clusterToNodeData(item));
    } else {
      components.push(componentToNodeData(item));
    }
  }

  // Convert gateway if present
  let gateway: GatewayNodeData | undefined;
  if (cell.gateway) {
    gateway = {
      id: cell.gateway.id,
      exposes: cell.gateway.exposes,
      policies: cell.gateway.policies,
      hasAuth: !!cell.gateway.auth,
      authType: cell.gateway.auth?.authType,
    };
  }

  // Convert internal connections
  const internalConnections = cell.connections.map((conn) => ({
    source: conn.source,
    target: conn.target,
  }));

  const data: CellNodeData = {
    type: 'cell',
    id: cell.id,
    label: cell.label ?? cell.id,
    cellType: cell.cellType,
    gateway,
    components,
    clusters,
    internalConnections,
  };

  return {
    id: cell.id,
    type: 'cell',
    position: { x: 0, y: 0 },
    data,
  };
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

  // Build source/target IDs with optional component references
  const sourceId = conn.source.component
    ? `${conn.source.entity}.${conn.source.component}`
    : conn.source.entity;
  const targetId = conn.target.component
    ? `${conn.target.entity}.${conn.target.component}`
    : conn.target.entity;

  return {
    id: `${sourceId}-${targetId}`,
    source: conn.source.entity,
    target: conn.target.entity,
    sourceHandle: conn.source.component ?? null,
    targetHandle: conn.target.component ?? null,
    type: 'connection',
    data,
    markerEnd: {
      type: 'arrowclosed' as MarkerType,
      width: 20,
      height: 20,
    },
  };
}

// ============================================
// Layout with Dagre
// ============================================

/**
 * Apply automatic layout to nodes using Dagre.
 */
export function applyLayout(
  state: DiagramState,
  options: LayoutOptions = {}
): DiagramState {
  const opts = { ...defaultLayoutOptions, ...options };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacingX,
    ranksep: opts.nodeSpacingY,
    marginx: opts.padding,
    marginy: opts.padding,
  });

  // Add nodes to dagre graph
  for (const node of state.nodes) {
    const dimensions = getNodeDimensions(node);
    dagreGraph.setNode(node.id, dimensions);
  }

  // Add edges to dagre graph
  for (const edge of state.edges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  // Run layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  const layoutedNodes = state.nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = getNodeDimensions(node);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges: state.edges,
  };
}

/**
 * Get estimated dimensions for a node based on its type and content.
 */
function getNodeDimensions(node: DiagramNode): { width: number; height: number } {
  switch (node.type) {
    case 'cell': {
      const cellData = node.data as CellNodeData;
      const baseHeight = 80; // Header + gateway area
      const componentHeight = cellData.components.length * 32;
      const clusterHeight = cellData.clusters.reduce(
        (sum, c) => sum + 48 + c.components.length * 28,
        0
      );
      const hasGateway = cellData.gateway ? 40 : 0;
      return {
        width: 320,
        height: Math.max(160, baseHeight + hasGateway + componentHeight + clusterHeight),
      };
    }
    case 'external':
      return { width: 140, height: 100 };
    case 'user':
      return { width: 120, height: 90 };
    case 'application':
      return { width: 400, height: 200 };
    default:
      return { width: 150, height: 50 };
  }
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

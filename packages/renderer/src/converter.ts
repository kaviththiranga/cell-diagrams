/**
 * AST to Diagram Converter
 *
 * Converts a Cell Diagrams AST into React Flow nodes and edges.
 */

import type { MarkerType } from '@xyflow/react';
import type {
  Program,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  Connection,
} from '@cell-diagrams/core';
import type {
  DiagramNode,
  DiagramEdge,
  DiagramState,
  CellNodeData,
  ExternalNodeData,
  UserNodeData,
  ComponentNodeData,
  EndpointNodeData,
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
    if (stmt.type === 'CellDefinition') {
      nodes.push(cellToNode(stmt));
    } else if (stmt.type === 'ExternalDefinition') {
      nodes.push(externalToNode(stmt));
    } else if (stmt.type === 'UserDefinition') {
      nodes.push(userToNode(stmt));
    } else if (stmt.type === 'Connection') {
      edges.push(connectionToEdge(stmt));
    }
  }

  return { nodes, edges };
}

/**
 * Convert a CellDefinition to a React Flow node.
 */
function cellToNode(cell: CellDefinition): DiagramNode {
  const components: ComponentNodeData[] = cell.components.map((comp) => ({
    id: comp.id,
    label: comp.id,
    componentType: comp.componentType,
    attributes: comp.attributes,
  }));

  const endpoints: EndpointNodeData[] = cell.exposedEndpoints.map((ep) => ({
    endpointType: ep.endpointType,
    componentRef: ep.componentRef,
    attributes: ep.attributes,
  }));

  const data: CellNodeData = {
    type: 'cell',
    id: cell.id,
    label: cell.name ?? cell.id,
    ...(cell.cellType !== undefined && { cellType: cell.cellType }),
    components,
    endpoints,
  };

  return {
    id: cell.id,
    type: 'cell',
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Convert an ExternalDefinition to a React Flow node.
 */
function externalToNode(external: ExternalDefinition): DiagramNode {
  const data: ExternalNodeData = {
    type: 'external',
    id: external.id,
    label: external.name ?? external.id,
    ...(external.externalType !== undefined && { externalType: external.externalType }),
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
    label: user.id,
    attributes: user.attributes,
  };

  return {
    id: user.id,
    type: 'user',
    position: { x: 0, y: 0 },
    data,
  };
}

/**
 * Convert a Connection to a React Flow edge.
 */
function connectionToEdge(conn: Connection): DiagramEdge {
  const labelAttr = conn.attributes.find((a) => a.key === 'label');
  const viaAttr = conn.attributes.find((a) => a.key === 'via');

  const label = typeof labelAttr?.value === 'string' ? labelAttr.value : undefined;
  const via = typeof viaAttr?.value === 'string' ? viaAttr.value : undefined;

  const data: ConnectionEdgeData = {
    ...(label !== undefined && { label }),
    ...(via !== undefined && { via }),
    attributes: conn.attributes,
  };

  return {
    id: `${conn.source}-${conn.target}`,
    source: conn.source,
    target: conn.target,
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
      const baseHeight = 60; // Header
      const componentHeight = cellData.components.length * 32;
      const endpointHeight = cellData.endpoints.length > 0 ? 40 : 0;
      return {
        width: 280,
        height: Math.max(120, baseHeight + componentHeight + endpointHeight),
      };
    }
    case 'external':
      return { width: 120, height: 100 };
    case 'user':
      return { width: 100, height: 80 };
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

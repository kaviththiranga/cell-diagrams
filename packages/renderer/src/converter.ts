/**
 * AST to Diagram Converter - Minimalist Excalidraw-style
 *
 * Converts a Cell Diagrams AST into React Flow nodes and edges.
 * Components and gateways are rendered as individual circular nodes.
 */

import type { MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import type {
  Program,
  CellDefinition,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  ComponentDefinition,
  ClusterDefinition,
  FlowDefinition,
  FlowConnection,
  GatewayDefinition,
  ErrorNode as ASTErrorNode,
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
  ErrorNodeData,
} from './types';
import { defaultLayoutOptions } from './types';
import type { ComponentNodeData as ComponentNodeDataType } from './nodes/ComponentNode';
import type { GatewayNodeData as GatewayNodeDataType, GatewayPosition } from './nodes/GatewayNode';

// ============================================
// Layout Constants for Minimalist Design
// ============================================

const CELL_PADDING = 60;

// ============================================
// AST to Diagram Conversion
// ============================================

/**
 * Layout components within a cell using dagre hierarchical layout.
 * Positions components based on their internal connections for a cleaner flow-based arrangement.
 */
function layoutComponentsWithDagre(
  components: ComponentDefinition[],
  internalConnections: Array<{ source: string; target: string }>,
  hasGateway: boolean,
  cellWidth: number,
  cellHeight: number
): Array<{ id: string; x: number; y: number }> {
  const componentSize = 50;
  const nodeSpacing = 80;
  const componentPositions: Array<{ id: string; x: number; y: number }> = [];

  // Edge cases: no components or single component
  if (components.length === 0) {
    return [];
  }

  if (components.length === 1) {
    // Center the single component
    return [{
      id: components[0]!.id,
      x: cellWidth / 2 - componentSize / 2,
      y: cellHeight / 2 - componentSize / 2,
    }];
  }

  // Build dagre graph
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB', // Top-to-bottom for hierarchical flow
    nodesep: nodeSpacing,
    ranksep: nodeSpacing,
    marginx: CELL_PADDING,
    marginy: CELL_PADDING + 30, // Extra space for label
  });

  // Add components to graph
  for (const comp of components) {
    g.setNode(comp.id, {
      width: componentSize,
      height: componentSize,
    });
  }

  // Add gateway as a node if present (acts as entry/exit point)
  if (hasGateway) {
    const gatewayId = 'gateway';
    g.setNode(gatewayId, {
      width: 45,
      height: 45,
    });

    // Find components connected to gateway (via internal connections)
    // We'll connect gateway to components that have no incoming connections
    // or are entry points
    const componentIds = new Set(components.map(c => c.id));
    const hasIncoming = new Set<string>();
    for (const conn of internalConnections) {
      if (componentIds.has(conn.target)) {
        hasIncoming.add(conn.target);
      }
    }

    // Connect gateway to entry point components (those with no incoming connections)
    let gatewayConnected = false;
    for (const comp of components) {
      if (!hasIncoming.has(comp.id)) {
        g.setEdge(gatewayId, comp.id);
        gatewayConnected = true;
      }
    }
    
    // If all components have incoming connections, connect gateway to the first component
    // to ensure proper layout positioning
    if (!gatewayConnected && components.length > 0) {
      g.setEdge(gatewayId, components[0]!.id);
    }
  }

  // Add internal connections as edges
  for (const conn of internalConnections) {
    // Only add edge if both source and target are components
    const sourceIsComponent = components.some(c => c.id === conn.source);
    const targetIsComponent = components.some(c => c.id === conn.target);
    
    if (sourceIsComponent && targetIsComponent) {
      g.setEdge(conn.source, conn.target);
    }
  }

  // If no edges exist, use fallback grid layout
  if (g.edges().length === 0 && !hasGateway) {
    // Simple grid fallback for unconnected components
    const cols = Math.ceil(Math.sqrt(components.length));
    const rows = Math.ceil(components.length / cols);
    const gridWidth = cols * (componentSize + nodeSpacing) - nodeSpacing;
    const gridHeight = rows * (componentSize + nodeSpacing) - nodeSpacing;
    const startX = (cellWidth - gridWidth) / 2;
    const startY = (cellHeight - gridHeight) / 2;

    for (let i = 0; i < components.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      componentPositions.push({
        id: components[i]!.id,
        x: startX + col * (componentSize + nodeSpacing),
        y: startY + row * (componentSize + nodeSpacing),
      });
    }
    return componentPositions;
  }

  // Run dagre layout
  dagre.layout(g);

  // Extract positions and transform to cell-relative coordinates
  const dagreNodes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const comp of components) {
    const dagreNode = g.node(comp.id);
    if (dagreNode) {
      const x = dagreNode.x - dagreNode.width / 2;
      const y = dagreNode.y - dagreNode.height / 2;
      dagreNodes.push({
        id: comp.id,
        x,
        y,
        width: dagreNode.width,
        height: dagreNode.height,
      });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + dagreNode.width);
      maxY = Math.max(maxY, y + dagreNode.height);
    }
  }

  // Calculate layout bounds
  const layoutWidth = maxX - minX;
  const layoutHeight = maxY - minY;

  // Center the layout within the cell, accounting for padding
  const availableWidth = cellWidth - 2 * CELL_PADDING;
  const availableHeight = cellHeight - 2 * CELL_PADDING - 30; // Extra space for label
  const offsetX = CELL_PADDING + (availableWidth - layoutWidth) / 2 - minX;
  const offsetY = CELL_PADDING + 30 + (availableHeight - layoutHeight) / 2 - minY;

  // Transform positions to cell-relative coordinates
  for (const node of dagreNodes) {
    componentPositions.push({
      id: node.id,
      x: node.x + offsetX,
      y: node.y + offsetY,
    });
  }

  return componentPositions;
}

/**
 * Convert a Cell Diagrams AST to React Flow nodes and edges.
 * This creates individual nodes for cells, components, gateways, etc.
 * Handles ErrorNodes from partial parsing for error visualization.
 */
export function astToDiagram(ast: Program): DiagramState {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Track cell positions for layout
  let cellIndex = 0;
  let errorIndex = 0;

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
      case 'FlowDefinition':
        edges.push(...flowDefinitionToEdges(stmt));
        break;
      case 'ErrorNode': {
        // Convert AST ErrorNode to diagram error node
        nodes.push(errorNodeToDiagramNode(stmt, errorIndex));
        errorIndex++;
        break;
      }
    }
  }

  return { nodes, edges };
}

/**
 * Convert an AST ErrorNode to a diagram node for visualization.
 */
function errorNodeToDiagramNode(
  errorNode: ASTErrorNode,
  index: number
): DiagramNode {
  const data: ErrorNodeData = {
    type: 'error',
    errorCode: errorNode.errorCode,
    message: errorNode.message,
    ruleName: errorNode.ruleName,
    recoveryHint: errorNode.recoveryHint,
    severity: 'error', // Default to error severity
    category: 'syntactic', // Default category
    line: errorNode.location?.start.line,
    column: errorNode.location?.start.column,
  };

  return {
    id: `error-${index}`,
    type: 'error',
    position: { x: 0, y: 0 }, // Will be positioned by layout engine
    data,
  } as DiagramNode;
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

  // Calculate cell size based on components using hierarchical layout
  // For a regular octagon with equal sides, we want the cell to be square
  const componentCount = allComponents.length;
  const componentSize = 50; // Size of component node
  const nodeSpacing = 80; // Spacing between nodes in dagre layout
  
  // Calculate optimal size based on component count and expected hierarchical layout
  // Estimate layout dimensions: components arranged in a flow-based hierarchy
  let estimatedWidth: number;
  let estimatedHeight: number;
  
  if (componentCount === 0) {
    estimatedWidth = 300;
    estimatedHeight = 300;
  } else if (componentCount === 1) {
    estimatedWidth = 300;
    estimatedHeight = 300;
  } else {
    // Estimate based on component count and connection topology
    // For hierarchical layout, estimate width and height based on likely arrangement
    const cols = Math.ceil(Math.sqrt(componentCount));
    const rows = Math.ceil(componentCount / cols);
    estimatedWidth = cols * (componentSize + nodeSpacing) + 2 * CELL_PADDING + 40;
    estimatedHeight = rows * (componentSize + nodeSpacing) + 2 * CELL_PADDING + 30 + 40; // +30 for label, +40 extra
  }
  
  // Ensure minimum size and make it square for octagon
  const cellSize = Math.max(300, Math.max(estimatedWidth, estimatedHeight));
  const cellWidth = cellSize;
  const cellHeight = cellSize;

  // Filter out ErrorNodes from gateways and flows
  const validGateways = cell.gateways.filter(
    (gw): gw is GatewayDefinition => gw.type !== 'ErrorNode'
  );
  const validFlows = cell.flows.filter(
    (flow): flow is FlowDefinition => flow.type !== 'ErrorNode'
  );

  // Get primary gateway (first ingress gateway or legacy gateway)
  const primaryGateway = validGateways.find(gw => gw.direction === 'ingress') ?? cell.gateway;

  // Collect all internal connections from flow definitions
  const allInternalConnections = validFlows.flatMap((flow) => flow.flows.map((f) => ({
    source: f.source,
    target: f.destination,
  })));

  // Count errors within this cell
  const gatewayErrorCount = cell.gateways.filter(gw => gw.type === 'ErrorNode').length;
  const componentErrorCount = cell.components.filter(c => c.type === 'ErrorNode').length;
  const flowErrorCount = cell.flows.filter(f => f.type === 'ErrorNode').length;
  const nestedCellErrorCount = cell.nestedCells.filter(nc => nc.type === 'ErrorNode').length;
  const totalErrorCount = gatewayErrorCount + componentErrorCount + flowErrorCount + nestedCellErrorCount;
  const hasErrors = totalErrorCount > 0;

  // Create cell boundary node
  const cellData: CellNodeData = {
    type: 'cell',
    id: cell.id,
    label: cell.label ?? cell.id,
    cellType: cell.cellType,
    gateway: primaryGateway
      ? {
          id: primaryGateway.id,
          exposes: primaryGateway.exposes,
          policies: primaryGateway.policies,
          hasAuth: !!primaryGateway.auth,
          authType: primaryGateway.auth?.authType,
        }
      : undefined,
    components: allComponents.map(componentToNodeData),
    clusters: clusters.map(clusterToNodeData),
    internalConnections: allInternalConnections,
    width: cellWidth,
    height: cellHeight,
    errorCount: totalErrorCount,
    hasErrors,
  };

  nodes.push({
    id: cell.id,
    type: 'cell',
    position: { x: 0, y: 0 },
    data: cellData,
    // Cell should be behind other nodes
    zIndex: -1,
  } as DiagramNode);

  // Create gateway nodes - positioned ON the cell boundary
  // Gateways are NOT children of the cell so they can overlap the boundary
  // Support multiple gateways (ingress/egress) at different positions
  const allGateways: GatewayDefinition[] = [...validGateways];
  if (cell.gateway && !validGateways.some(gw => gw.id === cell.gateway!.id)) {
    allGateways.push(cell.gateway);
  }

  for (const gateway of allGateways) {
    // Determine gateway position based on direction or explicit position
    // ingress defaults to north, egress defaults to south
    let gatewayPosition: GatewayPosition;
    if (gateway.position) {
      gatewayPosition = gateway.position;
    } else if (gateway.direction === 'egress') {
      gatewayPosition = 'south';
    } else {
      gatewayPosition = 'north';
    }

    // Determine gateway type from direction or label
    let gatewayType: 'external' | 'internal' | 'egress' = 'external';
    if (gateway.direction === 'egress') {
      gatewayType = 'egress';
    } else {
      const labelLower = (gateway.label ?? '').toLowerCase();
      if (labelLower.includes('internal') || gatewayPosition === 'west') {
        gatewayType = 'internal';
      } else if (labelLower.includes('egress') || gatewayPosition === 'south') {
        gatewayType = 'egress';
      }
    }

    const gatewayData: GatewayNodeDataType = {
      type: 'gateway',
      id: gateway.id,
      label: gateway.label ?? gateway.id,
      gatewayType,
      position: gatewayPosition,
      parentCell: cell.id,
      exposes: gateway.exposes,
      policies: gateway.policies ?? [],
      hasAuth: !!gateway.auth,
      ...(gateway.auth?.authType ? { authType: gateway.auth.authType } : {}),
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

    // Use a unique ID for each gateway
    const gatewayNodeId = gateway.id === 'gateway' ? `${cell.id}.gateway` : `${cell.id}.${gateway.id}`;

    nodes.push({
      id: gatewayNodeId,
      type: 'gateway',
      position: { x: gwX, y: gwY },
      data: gatewayData,
      parentId: cell.id,
      // Don't use extent: 'parent' so gateway can overlap boundary
    } as unknown as DiagramNode);
  }

  // Create component nodes positioned inside cell with hierarchical dagre layout
  // This creates a cleaner flow-based arrangement that follows connection topology
  // Use allInternalConnections which combines both legacy connections and flow definitions
  const componentPositions = layoutComponentsWithDagre(
    allComponents,
    allInternalConnections,
    !!cell.gateway,
    cellWidth,
    cellHeight
  );

  // Create component nodes with dagre-calculated positions
  for (const comp of allComponents) {
    const position = componentPositions.find(p => p.id === comp.id);
    
    // Fallback position if dagre didn't position this component
    const fallbackX = cellWidth / 2 - componentSize / 2;
    const fallbackY = cellHeight / 2 - componentSize / 2;
    
    const x = position ? position.x : fallbackX;
    const y = position ? position.y : fallbackY;
    
    // Ensure components stay within cell bounds (accounting for padding)
    const boundedX = Math.max(CELL_PADDING, Math.min(cellWidth - CELL_PADDING - componentSize, x));
    const boundedY = Math.max(CELL_PADDING + 30, Math.min(cellHeight - CELL_PADDING - componentSize, y));

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
        x: boundedX,
        y: boundedY,
      },
      data: compData,
      parentId: cell.id,
      extent: 'parent',
    } as unknown as DiagramNode);
  }

  // Create edges for internal connections - use smoothstep for curvy edges
  for (const conn of allInternalConnections) {
    edges.push({
      id: `${cell.id}.${conn.source}-${conn.target}`,
      source: `${cell.id}.${conn.source}`,
      target: `${cell.id}.${conn.target}`,
      type: 'connection', // Use our custom ConnectionEdge for curvy lines
      style: { stroke: '#868e96', strokeWidth: 1.5 },
      data: {
        direction: undefined,
        label: undefined,
        via: undefined,
        protocol: undefined,
        attributes: {},
      },
      markerEnd: {
        type: 'arrowclosed' as MarkerType,
        width: 15,
        height: 15,
        color: '#868e96',
      },
    });
  }

  // Process nested cells recursively (filter out ErrorNodes)
  const validNestedCells = cell.nestedCells.filter(
    (nc): nc is CellDefinition => nc.type !== 'ErrorNode'
  );
  let nestedCellIndex = 0;
  for (const nestedCell of validNestedCells) {
    const nestedResult = cellToNodes(nestedCell, nestedCellIndex);
    // Add nested cell nodes with parent reference
    for (const nestedNode of nestedResult.nodes) {
      if (nestedNode.type === 'cell') {
        // Position nested cells inside parent cell
        const nestedX = CELL_PADDING + nestedCellIndex * 320;
        const nestedY = cellHeight - 200;
        nodes.push({
          ...nestedNode,
          position: { x: nestedX, y: nestedY },
          parentId: cell.id,
          extent: 'parent',
        } as DiagramNode);
      } else {
        nodes.push(nestedNode);
      }
    }
    edges.push(...nestedResult.edges);
    nestedCellIndex++;
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
 * Convert a FlowDefinition to React Flow edges.
 * Handles top-level flow blocks for inter-cell connections.
 * Uses step (orthogonal) edges for cleaner routing between cells.
 */
function flowDefinitionToEdges(flow: FlowDefinition): DiagramEdge[] {
  return flow.flows.map((flowConn: FlowConnection) => {
    const data: ConnectionEdgeData = {
      direction: undefined,
      label: flowConn.label,
      via: undefined,
      protocol: undefined,
      attributes: {},
      edgeStyle: 'step', // Use step edges for inter-cell connections
    };

    return {
      id: `flow-${flowConn.source}-${flowConn.destination}`,
      source: flowConn.source,
      target: flowConn.destination,
      type: 'connection',
      style: { stroke: '#868e96', strokeWidth: 1.5 },
      data,
      markerEnd: {
        type: 'arrowclosed' as MarkerType,
        width: 15,
        height: 15,
        color: '#868e96',
      },
    };
  });
}

// ============================================
// Layout with Dagre Algorithm
// ============================================

/**
 * Get node dimensions for layout calculation.
 */
function getNodeSize(node: DiagramNode): { width: number; height: number } {
  switch (node.type) {
    case 'cell': {
      const cellData = node.data as CellNodeData;
      return {
        width: cellData.width ?? 400,
        height: cellData.height ?? 300,
      };
    }
    case 'user':
    case 'external':
      return { width: 100, height: 100 };
    case 'application':
      return { width: 320, height: 200 };
    case 'component':
      return { width: 80, height: 80 };
    case 'gateway':
      return { width: 60, height: 60 };
    default:
      return { width: 100, height: 100 };
  }
}

/**
 * Apply three-zone layout: Header (incoming), Middle (cells), Bottom (outgoing).
 * Cells are arranged horizontally in the middle with intelligent wrapping based on connections.
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
  const childNodes = state.nodes.filter(
    (n) => n.type === 'component' || n.type === 'gateway'
  );

  // Build sets for quick lookup
  const cellIds = new Set(cells.map((n) => n.id));

  // Analyze edges to categorize nodes into zones
  // Header: nodes that have outgoing edges TO cells (sources)
  // Bottom: nodes that have incoming edges FROM cells (targets)
  const headerNodes: DiagramNode[] = [];
  const bottomNodes: DiagramNode[] = [];
  const headerNodeIds = new Set<string>();
  const bottomNodeIds = new Set<string>();

  // Analyze edges to determine header (incoming to cells) and bottom (outgoing from cells)
  for (const edge of state.edges) {
    // Extract base IDs (remove component suffixes like "Cell.ComponentX")
    const sourceParts = edge.source.split('.');
    const targetParts = edge.target.split('.');
    const sourceBaseId = sourceParts[0] ?? edge.source;
    const targetBaseId = targetParts[0] ?? edge.target;
    const sourceBaseIsCell = cellIds.has(sourceBaseId);
    const targetBaseIsCell = cellIds.has(targetBaseId);

    // If edge goes from non-cell (user/external) to cell, source goes to header
    if (!sourceBaseIsCell && targetBaseIsCell) {
      headerNodeIds.add(sourceBaseId);
    }

    // If edge goes from cell to non-cell (external), target goes to bottom
    if (sourceBaseIsCell && !targetBaseIsCell) {
      bottomNodeIds.add(targetBaseId);
    }
  }

  // Also check for gateway connections - if edge connects to/from a gateway, 
  // we need to identify the cell it belongs to
  const gatewayToCellMap = new Map<string, string>(); // gatewayId -> cellId
  for (const gatewayNode of childNodes.filter(n => n.type === 'gateway')) {
    if (gatewayNode.parentId) {
      gatewayToCellMap.set(gatewayNode.id, gatewayNode.parentId);
    }
  }

  // Categorize users and externals
  for (const user of users) {
    if (headerNodeIds.has(user.id)) {
      headerNodes.push(user);
    } else if (bottomNodeIds.has(user.id)) {
      bottomNodes.push(user);
    } else {
      // Default: users go to header
      headerNodes.push(user);
    }
  }

  for (const ext of externals) {
    if (headerNodeIds.has(ext.id)) {
      headerNodes.push(ext);
    } else if (bottomNodeIds.has(ext.id)) {
      bottomNodes.push(ext);
    } else {
      // Default: externals without connections go to bottom
      bottomNodes.push(ext);
    }
  }

  // Applications can go in header if they connect to cells
  for (const app of applications) {
    if (headerNodeIds.has(app.id)) {
      headerNodes.push(app);
    } else {
      // Default: applications go to header
      headerNodes.push(app);
    }
  }

  const layoutedNodes: DiagramNode[] = [];

  // ============================================
  // ZONE 1: HEADER - Users and externals that talk TO cells
  // ============================================
  // Identify externals/users that connect to a single cell with northbound/southbound
  // These should be positioned directly above/below the cell's connection point
  const nodeToCellMap = new Map<string, { cellId: string; direction: 'northbound' | 'southbound' }>();
  
  for (const edge of state.edges) {
    const sourceParts = edge.source.split('.');
    const targetParts = edge.target.split('.');
    const sourceBaseId = sourceParts[0] ?? edge.source;
    const targetBaseId = targetParts[0] ?? edge.target;
    const sourceBaseIsCell = cellIds.has(sourceBaseId);
    const targetBaseIsCell = cellIds.has(targetBaseId);
    
    // Get edge data to check direction
    const edgeData = edge.data as ConnectionEdgeData | undefined;
    const direction = edgeData?.direction;
    
    // Only process northbound/southbound connections (external systems can only do these)
    if (direction !== 'northbound' && direction !== 'southbound') {
      continue;
    }
    
    // External/user to cell
    if (!sourceBaseIsCell && targetBaseIsCell) {
      const existing = nodeToCellMap.get(sourceBaseId);
      if (!existing) {
        // northbound: external is above cell, southbound: external is below cell
        nodeToCellMap.set(sourceBaseId, { cellId: targetBaseId, direction });
      } else if (existing.cellId !== targetBaseId) {
        // Connects to multiple cells - don't align with cell
        nodeToCellMap.delete(sourceBaseId);
      }
    }
    // Cell to external/user
    else if (sourceBaseIsCell && !targetBaseIsCell) {
      const existing = nodeToCellMap.get(targetBaseId);
      if (!existing) {
        // For cell to external: direction is from cell's perspective
        // northbound: external is above cell, southbound: external is below cell
        nodeToCellMap.set(targetBaseId, { cellId: sourceBaseId, direction });
      } else if (existing.cellId !== sourceBaseId) {
        // Connects to multiple cells - don't align with cell
        nodeToCellMap.delete(targetBaseId);
      }
    }
  }

  // Separate nodes that should be aligned with gateways from those that shouldn't
  const alignedHeaderNodes: DiagramNode[] = [];
  const regularHeaderNodes: DiagramNode[] = [];
  const alignedBottomNodes: DiagramNode[] = [];
  const regularBottomNodes: DiagramNode[] = [];

  for (const node of headerNodes) {
    if (nodeToCellMap.has(node.id)) {
      alignedHeaderNodes.push(node);
    } else {
      regularHeaderNodes.push(node);
    }
  }

  for (const node of bottomNodes) {
    if (nodeToCellMap.has(node.id)) {
      alignedBottomNodes.push(node);
    } else {
      regularBottomNodes.push(node);
    }
  }

  // Position regular header nodes first
  let headerY = opts.padding;
  let headerX = opts.padding;
  const headerSpacing = 120;

  for (const node of regularHeaderNodes) {
    const size = getNodeSize(node);
    layoutedNodes.push({
      ...node,
      position: { x: headerX, y: headerY },
    });
    headerX += size.width + headerSpacing;
  }

  // ============================================
  // ZONE 2: MIDDLE - Cells arranged horizontally
  // ============================================
  const middleStartY = headerNodes.length > 0
    ? headerY + 150 + opts.nodeSpacingY
    : opts.padding;

  // Arrange cells horizontally in a row
  if (cells.length > 0) {
    let cellX = opts.padding;
    for (const cell of cells) {
      const size = getNodeSize(cell);
      layoutedNodes.push({
        ...cell,
        position: { x: cellX, y: middleStartY },
      });
      cellX += size.width + opts.nodeSpacingX;
    }
  }

  // Calculate middle zone height
  const middleMaxY = cells.length > 0
    ? Math.max(...cells.map((c) => {
        const pos = layoutedNodes.find((n) => n.id === c.id)?.position ?? { x: 0, y: 0 };
        const size = getNodeSize(c);
        return pos.y + size.height;
      }))
    : middleStartY;

  // ============================================
  // ZONE 3: BOTTOM - Externals that cells talk TO
  // ============================================
  const bottomStartY = middleMaxY + opts.nodeSpacingY;
  let bottomX = opts.padding;
  const bottomSpacing = 120;

  // Position regular bottom nodes first
  for (const node of regularBottomNodes) {
    const size = getNodeSize(node);
    layoutedNodes.push({
      ...node,
      position: { x: bottomX, y: bottomStartY },
    });
    bottomX += size.width + bottomSpacing;
  }

  // Add child nodes (components and gateways) - they use relative positioning
  layoutedNodes.push(...childNodes);

  // Now position aligned nodes above/below their respective cells
  // For northbound: position above cell's top center
  // For southbound: position below cell's bottom center
  const cellPositions = new Map<string, { centerX: number; topY: number; bottomY: number }>();
  
  for (const cell of cells) {
    const cellNode = layoutedNodes.find(n => n.id === cell.id);
    if (cellNode) {
      const cellSize = getNodeSize(cellNode);
      const centerX = cellNode.position.x + cellSize.width / 2;
      const topY = cellNode.position.y;
      const bottomY = cellNode.position.y + cellSize.height;
      
      cellPositions.set(cell.id, {
        centerX,
        topY,
        bottomY,
      });
    }
  }

  // Position aligned header nodes above their cells (northbound)
  for (const node of alignedHeaderNodes) {
    const alignment = nodeToCellMap.get(node.id);
    if (alignment && alignment.direction === 'northbound') {
      const cellPos = cellPositions.get(alignment.cellId);
      if (cellPos) {
        const size = getNodeSize(node);
        // Position directly above cell, center-aligned
        layoutedNodes.push({
          ...node,
          position: {
            x: cellPos.centerX - size.width / 2, // Center align with cell
            y: cellPos.topY - size.height - 40, // 40px spacing above cell top
          },
        });
      } else {
        // Fallback to regular positioning
        const size = getNodeSize(node);
        layoutedNodes.push({
          ...node,
          position: { x: headerX, y: headerY },
        });
        headerX += size.width + headerSpacing;
      }
    } else {
      // Fallback to regular positioning
      const size = getNodeSize(node);
      layoutedNodes.push({
        ...node,
        position: { x: headerX, y: headerY },
      });
      headerX += size.width + headerSpacing;
    }
  }

  // Position aligned bottom nodes below their cells (southbound)
  for (const node of alignedBottomNodes) {
    const alignment = nodeToCellMap.get(node.id);
    if (alignment && alignment.direction === 'southbound') {
      const cellPos = cellPositions.get(alignment.cellId);
      if (cellPos) {
        const size = getNodeSize(node);
        // Position directly below cell, center-aligned
        layoutedNodes.push({
          ...node,
          position: {
            x: cellPos.centerX - size.width / 2, // Center align with cell
            y: cellPos.bottomY + 40, // 40px spacing below cell bottom
          },
        });
      } else {
        // Fallback to regular positioning
        const size = getNodeSize(node);
        layoutedNodes.push({
          ...node,
          position: { x: bottomX, y: bottomStartY },
        });
        bottomX += size.width + bottomSpacing;
      }
    } else {
      // Fallback to regular positioning
      const size = getNodeSize(node);
      layoutedNodes.push({
        ...node,
        position: { x: bottomX, y: bottomStartY },
      });
      bottomX += size.width + bottomSpacing;
    }
  }

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

// ============================================
// New Layout Engine Integration
// ============================================

import {
  LayoutEngine,
  type LayoutEngineOptions,
  type DiagramLayoutData,
  type CellLayoutData,
  type ExternalLayoutData,
  type LayoutEdge,
  type LayoutNode,
} from './layout';

/**
 * Convert DiagramState to LayoutEngine format
 */
function toLayoutData(state: DiagramState): DiagramLayoutData {
  const cells: CellLayoutData[] = [];
  const externals: ExternalLayoutData[] = [];
  const interCellConnections: LayoutEdge[] = [];
  const connections: LayoutEdge[] = [];

  // Build cell ID set for categorization
  const cellIds = new Set(
    state.nodes.filter((n) => n.type === 'cell').map((n) => n.id)
  );

  // Convert cells
  for (const node of state.nodes) {
    if (node.type === 'cell') {
      const cellData = node.data as CellNodeData;
      const components: LayoutNode[] = cellData.components.map((c) => ({
        id: c.id,
        width: 50,
        height: 50,
        data: c,
      }));

      const internalConnections: LayoutEdge[] = cellData.internalConnections.map(
        (conn, idx) => ({
          id: `${node.id}-internal-${idx}`,
          source: conn.source,
          target: conn.target,
        })
      );

      cells.push({
        id: node.id,
        components,
        internalConnections,
        gateway: cellData.gateway
          ? {
              id: cellData.gateway.id,
              position: 'top' as const, // Default to top
            }
          : undefined,
        // Pass pre-calculated dimensions from cellToNodes
        dimensions: cellData.width && cellData.height
          ? { width: cellData.width, height: cellData.height }
          : undefined,
      });
    }
  }

  // Convert externals and users
  for (const node of state.nodes) {
    if (node.type === 'external' || node.type === 'user') {
      const size = getNodeSize(node);
      externals.push({
        id: node.id,
        width: size.width,
        height: size.height,
        type: node.type as 'external' | 'user',
        data: node.data,
      });
    }
  }

  // Categorize edges
  for (const edge of state.edges) {
    const sourceParts = edge.source.split('.');
    const targetParts = edge.target.split('.');
    const sourceBaseId = sourceParts[0] ?? edge.source;
    const targetBaseId = targetParts[0] ?? edge.target;
    const sourceIsCell = cellIds.has(sourceBaseId);
    const targetIsCell = cellIds.has(targetBaseId);

    const layoutEdge: LayoutEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge.data,
    };

    if (sourceIsCell && targetIsCell && sourceBaseId !== targetBaseId) {
      // Inter-cell connection
      interCellConnections.push({
        ...layoutEdge,
        source: sourceBaseId,
        target: targetBaseId,
      });
    }

    // All connections
    connections.push(layoutEdge);
  }

  return {
    cells,
    externals,
    interCellConnections,
    connections,
  };
}

/**
 * Apply layout using the new LayoutEngine.
 * This provides enhanced auto-positioning with:
 * - Two-graph strategy for linked/unlinked nodes
 * - Dynamic cell sizing
 * - Grid fallback for overlaps
 * - Boundary positioning for externals
 * - Bezier edge routing
 */
export function applyLayoutWithEngine(
  state: DiagramState,
  options: Partial<LayoutEngineOptions> = {}
): DiagramState {
  const engine = new LayoutEngine(options);
  const layoutData = toLayoutData(state);
  const result = engine.layout(layoutData);

  // Apply positions to nodes
  // NOTE: Child nodes (components, gateways) keep their relative positions
  // calculated by cellToNodes - we only reposition top-level nodes
  // IMPORTANT: We do NOT update cell dimensions from LayoutEngine because
  // component positions were calculated based on the original cell dimensions
  // in cellToNodes. Changing dimensions without adjusting component positions
  // would break the layout.
  const layoutedNodes: DiagramNode[] = state.nodes.map((node) => {
    // Skip child nodes - they use relative positioning within their parent cell
    // The positions are already calculated correctly in cellToNodes
    if (node.parentId) {
      return node;
    }

    const position = result.nodes.get(node.id);
    if (position) {
      // For cells, only update position - keep original dimensions from cellToNodes
      // because component positions were calculated based on those dimensions
      return {
        ...node,
        position: { x: position.x, y: position.y },
      };
    }
    return node;
  });

  return {
    nodes: layoutedNodes,
    edges: state.edges,
  };
}

/**
 * Get the LayoutEngine class for direct use
 */
export { LayoutEngine } from './layout';
export type { LayoutEngineOptions } from './layout';

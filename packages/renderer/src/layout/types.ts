/**
 * Layout Engine Types
 *
 * Type definitions for the auto-positioning layout engine.
 * Based on patterns from cell-diagram library.
 */

// ============================================
// Basic Geometric Types
// ============================================

/** 2D position */
export interface Position {
  x: number;
  y: number;
}

/** Dimensions of a rectangular element */
export interface Dimensions {
  width: number;
  height: number;
}

/** Bounding box for a region */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Cell dimensions with content offset */
export interface CellDimensions extends Dimensions {
  contentOffset: Position;
}

// ============================================
// Node Types for Layout
// ============================================

/** Generic node for layout calculations */
export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  data?: unknown;
}

/** Node position result from layout */
export interface NodePosition extends Position {
  width: number;
  height: number;
}

/** Edge for layout calculations */
export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  data?: unknown;
}

/** Edge path result from routing */
export interface EdgePath {
  id: string;
  source: string;
  target: string;
  path: string;
  sourcePort?: PortAlignment;
  targetPort?: PortAlignment;
}

// ============================================
// Port and Boundary Types
// ============================================

/** Port alignment on a node boundary */
export type PortAlignment = 'top' | 'bottom' | 'left' | 'right';

/** Cell boundary direction (for external positioning) */
export type CellBound = 'north' | 'south' | 'east' | 'west';

/** Port position on a node */
export interface PortPosition extends Position {
  alignment: PortAlignment;
  nodeId: string;
}

// ============================================
// Layout Algorithm Types
// ============================================

/** Supported layout algorithms */
export type LayoutAlgorithm = 'dagre' | 'elk' | 'grid';

/** Layout direction */
export type RankDirection = 'TB' | 'BT' | 'LR' | 'RL';

/** Edge routing style */
export type EdgeStyle = 'straight' | 'bezier' | 'orthogonal';

// ============================================
// Layout Options
// ============================================

/** Configuration options for the layout engine */
export interface LayoutEngineOptions {
  // Algorithm selection
  algorithm: LayoutAlgorithm;

  // Graph layout
  rankDirection: RankDirection;
  nodeSpacing: number;
  rankSpacing: number;

  // Cell sizing
  minCellSize: number;
  cellPaddingMultiplier: number;

  // External positioning
  externalSpacing: number;
  externalOffset: number;

  // Edge routing
  edgeStyle: EdgeStyle;
  curveRadius: number;
  bidirectionalOffset: number;

  // Overlap handling
  overlapPadding: number;

  // Grid layout specific
  gridSpacing: number;
}

/** Default layout engine options */
export const DEFAULT_LAYOUT_OPTIONS: LayoutEngineOptions = {
  algorithm: 'dagre',
  rankDirection: 'TB',
  nodeSpacing: 80,
  rankSpacing: 100,
  minCellSize: 300,
  cellPaddingMultiplier: 1.5,
  externalSpacing: 50,
  externalOffset: 150,
  edgeStyle: 'bezier',
  curveRadius: 10,
  bidirectionalOffset: 20,
  overlapPadding: 20,
  gridSpacing: 100,
};

// ============================================
// Diagram Data Types (Input)
// ============================================

/** Cell data for layout */
export interface CellLayoutData {
  id: string;
  components: LayoutNode[];
  internalConnections: LayoutEdge[];
  gateway?: {
    id: string;
    position: PortAlignment;
  } | undefined;
}

/** External node data for layout */
export interface ExternalLayoutData extends LayoutNode {
  type: 'user' | 'external';
  connectedTo?: string;
  direction?: CellBound;
}

/** Complete diagram data for layout */
export interface DiagramLayoutData {
  cells: CellLayoutData[];
  externals: ExternalLayoutData[];
  interCellConnections: LayoutEdge[];
  connections: LayoutEdge[];
}

// ============================================
// Layout Result Types (Output)
// ============================================

/** Result of layout operation */
export interface LayoutResult {
  /** Positioned nodes by ID */
  nodes: Map<string, NodePosition>;
  /** Routed edges by ID */
  edges: Map<string, EdgePath>;
  /** Cell dimensions by cell ID */
  cellDimensions: Map<string, CellDimensions>;
  /** Total bounding box of the diagram */
  bounds: BoundingBox;
}

/** Result of laying out a single cell */
export interface CellLayoutResult {
  nodePositions: Map<string, Position>;
  dimensions: CellDimensions;
  bounds: BoundingBox;
}

// ============================================
// Graph Types for Two-Graph Strategy
// ============================================

/** Separated graphs for linked/unlinked nodes */
export interface SeparatedGraphs {
  linkedNodes: LayoutNode[];
  linkedEdges: LayoutEdge[];
  unlinkedNodes: LayoutNode[];
}

// ============================================
// Overlap Detection Types
// ============================================

/** Overlap between two nodes */
export interface NodeOverlap {
  nodeA: string;
  nodeB: string;
  overlapArea: number;
}

// ============================================
// Layout Engine Interface
// ============================================

/** Interface for layout engine implementations */
export interface ILayoutEngine {
  /** Perform layout on diagram data */
  layout(diagram: DiagramLayoutData): LayoutResult;

  /** Configure layout options */
  configure(options: Partial<LayoutEngineOptions>): void;

  /** Get current options */
  getOptions(): LayoutEngineOptions;
}

/** Interface for layout algorithm adapters */
export interface ILayoutAlgorithm {
  /** Layout nodes and edges */
  layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: Partial<LayoutEngineOptions>
  ): Map<string, Position>;
}

/** Interface for edge routers */
export interface IEdgeRouter {
  /** Route an edge between two positions */
  route(
    source: Position,
    target: Position,
    options?: {
      sourcePort?: PortAlignment;
      targetPort?: PortAlignment;
    }
  ): string;
}

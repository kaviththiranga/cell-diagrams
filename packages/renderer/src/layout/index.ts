/**
 * Layout Engine Module
 *
 * Auto-positioning and edge case handling for cell diagrams.
 * Based on patterns from the cell-diagram library.
 */

// Main engine
export { LayoutEngine } from './LayoutEngine';

// Types
export type {
  // Geometric types
  Position,
  Dimensions,
  BoundingBox,
  CellDimensions,
  // Node/Edge types
  LayoutNode,
  NodePosition,
  LayoutEdge,
  EdgePath,
  // Port types
  PortAlignment,
  PortPosition,
  // Boundary types
  CellBound,
  // Options
  LayoutEngineOptions,
  LayoutAlgorithm,
  RankDirection,
  EdgeStyle,
  // Diagram data
  CellLayoutData,
  ExternalLayoutData,
  DiagramLayoutData,
  // Results
  LayoutResult,
  CellLayoutResult,
  SeparatedGraphs,
  NodeOverlap,
  // Interfaces
  ILayoutEngine,
  ILayoutAlgorithm,
  IEdgeRouter,
} from './types';

export { DEFAULT_LAYOUT_OPTIONS } from './types';

// Algorithms
export { DagreAdapter } from './algorithms/DagreAdapter';
export { GridLayout } from './algorithms/GridLayout';

// Strategies
export { TwoGraphStrategy } from './strategies/TwoGraphStrategy';
export { CellSizer } from './strategies/CellSizer';
export { OverlapResolver } from './strategies/OverlapResolver';
export { BoundaryPositioner } from './strategies/BoundaryPositioner';
export type { CellBounds } from './strategies/BoundaryPositioner';

// Routing
export { BezierRouter } from './routing/BezierRouter';
export * from './routing/PathUtils';

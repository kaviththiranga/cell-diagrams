/**
 * @cell-diagrams/renderer
 *
 * React Flow renderer for Cell Diagrams.
 */

// Main component
export { CellDiagram } from './components';

// Hooks
export { useCellDiagram } from './hooks';
export type { UseCellDiagramOptions, UseCellDiagramResult } from './hooks';

// Custom nodes
export { CellNode, ExternalNode, UserNode, nodeTypes } from './nodes';

// Custom edges
export { ConnectionEdge, edgeTypes } from './edges';

// Converter functions
export { astToDiagram, applyLayout, findNode, findConnectedEdges } from './converter';

// Types
export type {
  CellNodeData,
  ExternalNodeData,
  UserNodeData,
  ComponentNodeData,
  EndpointNodeData,
  DiagramNodeData,
  ConnectionEdgeData,
  DiagramNode,
  DiagramEdge,
  DiagramState,
  LayoutOptions,
  CellDiagramProps,
} from './types';

export {
  defaultLayoutOptions,
  COMPONENT_ICONS,
  CELL_TYPE_COLORS,
} from './types';

// Re-export useful React Flow types
export type { Node, Edge, NodeProps, EdgeProps } from '@xyflow/react';

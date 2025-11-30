/**
 * Cell Diagrams Renderer Types
 *
 * Type definitions for the diagram renderer.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  ComponentType,
  CellType,
  EndpointType,
  Attribute,
} from '@cell-diagrams/core';

// ============================================
// Node Data Types
// ============================================

/** Data for a Cell node */
export interface CellNodeData extends Record<string, unknown> {
  type: 'cell';
  id: string;
  label: string;
  cellType?: CellType;
  components: ComponentNodeData[];
  endpoints: EndpointNodeData[];
}

/** Data for a component within a cell */
export interface ComponentNodeData {
  id: string;
  label: string;
  componentType: ComponentType;
  attributes: Attribute[];
}

/** Data for an endpoint within a cell */
export interface EndpointNodeData {
  endpointType: EndpointType;
  componentRef: string;
  attributes: Attribute[];
}

/** Data for an External system node */
export interface ExternalNodeData extends Record<string, unknown> {
  type: 'external';
  id: string;
  label: string;
  externalType?: string;
}

/** Data for a User/Actor node */
export interface UserNodeData extends Record<string, unknown> {
  type: 'user';
  id: string;
  label: string;
  attributes: Attribute[];
}

/** Union of all node data types */
export type DiagramNodeData = CellNodeData | ExternalNodeData | UserNodeData;

// ============================================
// Edge Data Types
// ============================================

/** Data for a connection edge */
export interface ConnectionEdgeData extends Record<string, unknown> {
  label?: string;
  via?: string;
  attributes: Attribute[];
}

// ============================================
// React Flow Node/Edge Types
// ============================================

export type CellNode = Node<CellNodeData, 'cell'>;
export type ExternalNode = Node<ExternalNodeData, 'external'>;
export type UserNode = Node<UserNodeData, 'user'>;

export type DiagramNode = CellNode | ExternalNode | UserNode;
export type DiagramEdge = Edge<ConnectionEdgeData>;

// ============================================
// Diagram State
// ============================================

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// ============================================
// Layout Options
// ============================================

export interface LayoutOptions {
  /** Direction of the layout */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  /** Horizontal spacing between nodes */
  nodeSpacingX?: number;
  /** Vertical spacing between nodes */
  nodeSpacingY?: number;
  /** Padding around the diagram */
  padding?: number;
}

export const defaultLayoutOptions: Required<LayoutOptions> = {
  direction: 'TB',
  nodeSpacingX: 100,
  nodeSpacingY: 80,
  padding: 50,
};

// ============================================
// Component Props
// ============================================

export interface CellDiagramProps {
  /** The source code to render */
  source?: string;
  /** Layout options */
  layoutOptions?: LayoutOptions;
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string, nodeData: DiagramNodeData) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edgeId: string, edgeData: ConnectionEdgeData) => void;
  /** Whether to fit the view on load */
  fitView?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================
// Icon Mappings
// ============================================

export const COMPONENT_ICONS: Record<ComponentType, string> = {
  microservice: '⚙️',
  function: 'λ',
  database: '🗄️',
  gateway: '🚪',
  service: '📦',
  broker: '📨',
  cache: '⚡',
  legacy: '🏛️',
  esb: '🔀',
  idp: '🔐',
};

export const CELL_TYPE_COLORS: Record<CellType, string> = {
  logic: '#4f46e5',      // Indigo
  integration: '#0891b2', // Cyan
  legacy: '#78716c',     // Stone
  data: '#059669',       // Emerald
  security: '#dc2626',   // Red
  channel: '#7c3aed',    // Violet
  external: '#6b7280',   // Gray
};

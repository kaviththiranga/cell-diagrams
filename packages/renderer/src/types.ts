/**
 * Cell Diagrams Renderer Types
 *
 * Type definitions for the diagram renderer.
 * Updated for Cell-Based Architecture DSL.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  ComponentType,
  CellType,
  EndpointType,
  ConnectionDirection,
  ExternalType,
  UserType,
  AttributeValue,
} from '@cell-diagrams/core';

// ============================================
// Node Data Types
// ============================================

/** Gateway data for cell boundary */
export interface GatewayNodeData {
  id: string;
  exposes: EndpointType[];
  policies?: string[] | undefined;
  hasAuth?: boolean | undefined;
  authType?: 'local-sts' | 'federated' | undefined;
}

/** Data for a component within a cell */
export interface ComponentNodeData {
  id: string;
  label: string;
  componentType: ComponentType;
  attributes: Record<string, AttributeValue>;
  sidecars?: string[] | undefined;
}

/** Data for a cluster within a cell */
export interface ClusterNodeData {
  id: string;
  clusterType?: string | undefined;
  replicas?: number | undefined;
  components: ComponentNodeData[];
}

/** Data for a Cell node */
export interface CellNodeData extends Record<string, unknown> {
  type: 'cell';
  id: string;
  label: string;
  cellType: CellType;
  gateway?: GatewayNodeData | undefined;
  components: ComponentNodeData[];
  clusters: ClusterNodeData[];
  internalConnections: Array<{ source: string; target: string }>;
  /** Width of the cell boundary (for minimalist rendering) */
  width?: number;
  /** Height of the cell boundary (for minimalist rendering) */
  height?: number;
}

/** Data for an External system node */
export interface ExternalNodeData extends Record<string, unknown> {
  type: 'external';
  id: string;
  label: string;
  externalType: ExternalType;
  provides?: EndpointType[] | undefined;
}

/** Data for a User/Actor node */
export interface UserNodeData extends Record<string, unknown> {
  type: 'user';
  id: string;
  label: string;
  userType: UserType;
  channels?: string[] | undefined;
}

/** Data for an Application container node */
export interface ApplicationNodeData extends Record<string, unknown> {
  type: 'application';
  id: string;
  label: string;
  version?: string | undefined;
  cells: string[];
  gateway?: GatewayNodeData | undefined;
}

/** Union of all node data types */
export type DiagramNodeData =
  | CellNodeData
  | ExternalNodeData
  | UserNodeData
  | ApplicationNodeData;

// ============================================
// Edge Data Types
// ============================================

/** Data for a connection edge */
export interface ConnectionEdgeData extends Record<string, unknown> {
  direction?: ConnectionDirection | undefined;
  label?: string | undefined;
  via?: string | undefined;
  protocol?: string | undefined;
  attributes: Record<string, AttributeValue>;
}

// ============================================
// React Flow Node/Edge Types
// ============================================

export type CellNode = Node<CellNodeData, 'cell'>;
export type ExternalNode = Node<ExternalNodeData, 'external'>;
export type UserNode = Node<UserNodeData, 'user'>;
export type ApplicationNode = Node<ApplicationNodeData, 'application'>;

// Import component and gateway node data types
import type { ComponentNodeData as CompNodeData } from './nodes/ComponentNode';
import type { GatewayNodeData as GwNodeData } from './nodes/GatewayNode';

export type ComponentNode = Node<CompNodeData, 'component'>;
export type GatewayNode = Node<GwNodeData, 'gateway'>;

export type DiagramNode = CellNode | ExternalNode | UserNode | ApplicationNode | ComponentNode | GatewayNode;
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
  broker: '📨',
  cache: '⚡',
  gateway: '🚪',
  idp: '🔐',
  sts: '🎫',
  userstore: '👥',
  esb: '🔀',
  adapter: '🔌',
  transformer: '🔄',
  webapp: '🌐',
  mobile: '📱',
  iot: '📡',
  legacy: '🏛️',
};

export const CELL_TYPE_COLORS: Record<CellType, string> = {
  logic: '#4f46e5',      // Indigo
  integration: '#0891b2', // Cyan
  data: '#059669',       // Emerald
  security: '#dc2626',   // Red
  channel: '#7c3aed',    // Violet
  legacy: '#78716c',     // Stone
};

export const DIRECTION_COLORS: Record<ConnectionDirection, string> = {
  northbound: '#22c55e',  // Green
  southbound: '#3b82f6',  // Blue
  eastbound: '#f59e0b',   // Amber
  westbound: '#8b5cf6',   // Purple
};

export const EXTERNAL_TYPE_ICONS: Record<ExternalType, string> = {
  saas: '☁️',
  partner: '🤝',
  enterprise: '🏢',
};

export const USER_TYPE_ICONS: Record<UserType, string> = {
  external: '👤',
  internal: '🏢',
  system: '🤖',
};

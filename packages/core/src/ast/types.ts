/**
 * Cell Diagrams AST Type Definitions
 *
 * Complete type system for Cell-Based Architecture DSL.
 * Supports cells, gateways, components, clusters, connections, users, and external systems.
 */

// ============================================
// Source Location Types
// ============================================

export interface Position {
  /** 1-based line number */
  line: number;
  /** 1-based column number */
  column: number;
  /** 0-based character offset */
  offset: number;
}

export interface Location {
  start: Position;
  end: Position;
}

// ============================================
// Base Node
// ============================================

export interface BaseNode {
  type: string;
  location?: Location;
}

// ============================================
// Enumerated Types
// ============================================

/** Cell classification types (from Cell-Based Architecture reference) */
export type CellType =
  | 'logic'       // Microservices, functions, gateways, lightweight storage
  | 'integration' // ESB, adapters, transformers, integration microservices
  | 'data'        // RDBMS, NoSQL, file storage, message brokers
  | 'security'    // IDP, STS, user stores
  | 'channel'     // Web apps, mobile apps, IoT, portlets
  | 'legacy';     // Existing systems, COTS

/** Types of components that can exist within a cell */
export type ComponentType =
  // Core types
  | 'microservice'
  | 'function'
  | 'database'
  | 'broker'
  | 'cache'
  | 'gateway'
  // Security types
  | 'idp'
  | 'sts'
  | 'userstore'
  // Integration types
  | 'esb'
  | 'adapter'
  | 'transformer'
  // Frontend types
  | 'webapp'
  | 'mobile'
  | 'iot'
  // Legacy types
  | 'legacy';

/** Short aliases for component types (DSL convenience) */
export type ComponentTypeAlias = 'ms' | 'fn' | 'db';

/** Types of exposed endpoints (gateway communication types) */
export type EndpointType =
  | 'api'     // Request-response (REST, GraphQL, gRPC)
  | 'events'  // Event-driven (pub/sub)
  | 'stream'; // Data streaming

/** Connection direction (telecom terminology from reference) */
export type ConnectionDirection =
  | 'northbound'  // Ingress from users/channels into cell
  | 'southbound'  // Egress from cell to external systems
  | 'eastbound'   // Egress to another cell
  | 'westbound';  // Ingress from another cell

/** External system types */
export type ExternalType =
  | 'saas'       // SaaS applications
  | 'partner'    // Partner integrations
  | 'enterprise'; // Enterprise systems

/** User/actor types */
export type UserType =
  | 'external'  // External customers
  | 'internal'  // Internal employees
  | 'system';   // System/batch processes

/** Authentication configuration types */
export type AuthType =
  | 'local-sts'   // STS inside the cell
  | 'federated';  // Federated to external IDP

/** Gateway position on cell boundary */
export type GatewayPosition =
  | 'north'   // Top of cell (external ingress)
  | 'south'   // Bottom of cell (egress to external)
  | 'east'    // Right side (eastbound to other cells)
  | 'west';   // Left side (westbound from other cells)

// ============================================
// AST Node Definitions
// ============================================

/** Root node of the AST - represents an entire diagram */
export interface Program extends BaseNode {
  type: 'Program';
  /** Optional diagram name from `diagram "Name" { ... }` */
  name?: string;
  /** All top-level statements */
  statements: Statement[];
}

/** Union of all top-level statement types */
export type Statement =
  | CellDefinition
  | ExternalDefinition
  | UserDefinition
  | ApplicationDefinition
  | ConnectionsBlock;

// ============================================
// Cell Definition
// ============================================

/** Cell definition - the core unit of cell-based architecture */
export interface CellDefinition extends BaseNode {
  type: 'CellDefinition';
  /** Unique identifier for the cell */
  id: string;
  /** Human-readable display label */
  label?: string;
  /** Cell classification type */
  cellType: CellType;
  /** Gateway at cell boundary (control point) - deprecated, use gateways array */
  gateway?: GatewayDefinition;
  /** Multiple gateways at different positions on cell boundary */
  gateways?: GatewayDefinition[];
  /** Components inside the cell */
  components: (ComponentDefinition | ClusterDefinition)[];
  /** Internal connections between components */
  connections: InternalConnection[];
}

// ============================================
// Gateway Definition
// ============================================

/** Gateway at cell boundary - the control point for cell access */
export interface GatewayDefinition extends BaseNode {
  type: 'GatewayDefinition';
  /** Gateway identifier */
  id: string;
  /** Position on cell boundary (north, south, east, west) */
  position?: GatewayPosition;
  /** Gateway type label (e.g., "External gateway", "Internal gateway", "Egress gateway") */
  label?: string;
  /** Endpoint types exposed by this gateway */
  exposes: EndpointType[];
  /** Security/governance policies applied at gateway */
  policies?: string[];
  /** Authentication configuration */
  auth?: AuthConfig;
}

/** Authentication configuration for gateway */
export interface AuthConfig extends BaseNode {
  type: 'AuthConfig';
  /** Auth type: local STS or federated */
  authType: AuthType;
  /** Reference to external IDP for federated auth (e.g., "SecurityCell.EnterpriseIDP") */
  reference?: string;
}

// ============================================
// Component Definitions
// ============================================

/** Component within a cell */
export interface ComponentDefinition extends BaseNode {
  type: 'ComponentDefinition';
  /** Unique identifier for the component */
  id: string;
  /** Type of component */
  componentType: ComponentType;
  /** Key-value attributes (tech, replicas, etc.) */
  attributes: Record<string, AttributeValue>;
  /** Attached sidecars */
  sidecars?: string[];
}

/** Cluster of related components (e.g., database replicas) */
export interface ClusterDefinition extends BaseNode {
  type: 'ClusterDefinition';
  /** Cluster identifier */
  id: string;
  /** Type of components in cluster */
  clusterType?: string;
  /** Number of replicas */
  replicas?: number;
  /** Components in the cluster */
  components: ComponentDefinition[];
}

/** Attribute value types */
export type AttributeValue = string | number | boolean | string[];

// ============================================
// Connection Definitions
// ============================================

/** Internal connection between components within a cell */
export interface InternalConnection extends BaseNode {
  type: 'InternalConnection';
  /** Source component ID */
  source: string;
  /** Target component ID */
  target: string;
}

/** Block of inter-cell/external connections */
export interface ConnectionsBlock extends BaseNode {
  type: 'ConnectionsBlock';
  /** List of connections */
  connections: Connection[];
}

/** Inter-cell or user-to-cell connection */
export interface Connection extends BaseNode {
  type: 'Connection';
  /** Traffic direction */
  direction?: ConnectionDirection;
  /** Source endpoint */
  source: ConnectionEndpoint;
  /** Target endpoint */
  target: ConnectionEndpoint;
  /** Connection attributes (via, label, protocol, etc.) */
  attributes: Record<string, AttributeValue>;
}

/** Endpoint reference in a connection (Cell.Gateway or just Cell) */
export interface ConnectionEndpoint extends BaseNode {
  type: 'ConnectionEndpoint';
  /** Entity ID (cell, user, or external) */
  entity: string;
  /** Optional component/gateway reference */
  component?: string;
}

// ============================================
// External System Definition
// ============================================

/** External system (SaaS, partner, enterprise) */
export interface ExternalDefinition extends BaseNode {
  type: 'ExternalDefinition';
  /** Unique identifier */
  id: string;
  /** Display label */
  label?: string;
  /** Type of external system */
  externalType: ExternalType;
  /** Endpoint types provided */
  provides?: EndpointType[];
}

// ============================================
// User/Actor Definition
// ============================================

/** User or actor that interacts with the system */
export interface UserDefinition extends BaseNode {
  type: 'UserDefinition';
  /** Unique identifier */
  id: string;
  /** Display label */
  label?: string;
  /** User type */
  userType: UserType;
  /** Channels the user interacts through */
  channels?: string[];
}

// ============================================
// Virtual Application Definition
// ============================================

/** Virtual application - a group of related cells */
export interface ApplicationDefinition extends BaseNode {
  type: 'ApplicationDefinition';
  /** Application identifier */
  id: string;
  /** Display label */
  label?: string;
  /** Version string */
  version?: string;
  /** Cell IDs included in this application */
  cells: string[];
  /** Optional application-level gateway */
  gateway?: GatewayDefinition;
}

// ============================================
// Type Guards
// ============================================

export function isCellDefinition(node: Statement): node is CellDefinition {
  return node.type === 'CellDefinition';
}

export function isExternalDefinition(node: Statement): node is ExternalDefinition {
  return node.type === 'ExternalDefinition';
}

export function isUserDefinition(node: Statement): node is UserDefinition {
  return node.type === 'UserDefinition';
}

export function isApplicationDefinition(node: Statement): node is ApplicationDefinition {
  return node.type === 'ApplicationDefinition';
}

export function isConnectionsBlock(node: Statement): node is ConnectionsBlock {
  return node.type === 'ConnectionsBlock';
}

export function isClusterDefinition(
  node: ComponentDefinition | ClusterDefinition
): node is ClusterDefinition {
  return node.type === 'ClusterDefinition';
}

export function isComponentDefinition(
  node: ComponentDefinition | ClusterDefinition
): node is ComponentDefinition {
  return node.type === 'ComponentDefinition';
}

// ============================================
// Component Type Mappings
// ============================================

/** Map from alias to full component type */
export const COMPONENT_TYPE_ALIAS_MAP: Record<ComponentTypeAlias, ComponentType> = {
  ms: 'microservice',
  fn: 'function',
  db: 'database',
};

/** All valid component type keywords (full names + aliases) */
export const ALL_COMPONENT_TYPES: string[] = [
  // Full names
  'microservice', 'function', 'database', 'broker', 'cache', 'gateway',
  'idp', 'sts', 'userstore', 'esb', 'adapter', 'transformer',
  'webapp', 'mobile', 'iot', 'legacy',
  // Aliases
  'ms', 'fn', 'db',
];

/** Map component type to display label */
export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  microservice: 'Microservice',
  function: 'Function',
  database: 'Database',
  broker: 'Broker',
  cache: 'Cache',
  gateway: 'Gateway',
  idp: 'Identity Provider',
  sts: 'Security Token Service',
  userstore: 'User Store',
  esb: 'ESB',
  adapter: 'Adapter',
  transformer: 'Transformer',
  webapp: 'Web App',
  mobile: 'Mobile App',
  iot: 'IoT Gateway',
  legacy: 'Legacy System',
};

/** Map cell type to display label */
export const CELL_TYPE_LABELS: Record<CellType, string> = {
  logic: 'Logic',
  integration: 'Integration',
  data: 'Data',
  security: 'Security',
  channel: 'Channel',
  legacy: 'Legacy',
};

/** Map connection direction to display info */
export const DIRECTION_INFO: Record<ConnectionDirection, { label: string; description: string }> = {
  northbound: { label: 'N', description: 'Ingress from users/channels' },
  southbound: { label: 'S', description: 'Egress to external systems' },
  eastbound: { label: 'E', description: 'Egress to another cell' },
  westbound: { label: 'W', description: 'Ingress from another cell' },
};

/**
 * CellDL AST Type Definitions
 *
 * Complete type system for Cell-Based Architecture DSL.
 * Uses the new CellDL syntax (workspace, flow, route).
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
// Error Node (for partial AST with errors)
// ============================================

/**
 * Represents a syntax error in the AST.
 * Used when error recovery produces a partial AST.
 * ErrorNodes can appear anywhere a statement or component could appear.
 */
export interface ErrorNode extends BaseNode {
  type: 'ErrorNode';
  /** Error code for programmatic handling */
  errorCode: number;
  /** Human-readable error message */
  message: string;
  /** Grammar rule where the error occurred */
  ruleName?: string;
  /** Hint for fixing the error */
  recoveryHint?: string;
  /** Partial data that was successfully parsed before the error */
  partialData?: Record<string, unknown>;
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

/** Gateway direction (new CellDL syntax) */
export type GatewayDirection = 'ingress' | 'egress';

/** Gateway position on cell boundary */
export type GatewayPosition =
  | 'north'   // Top of cell (external ingress)
  | 'south'   // Bottom of cell (egress to external)
  | 'east'    // Right side (eastbound to other cells)
  | 'west';   // Left side (westbound from other cells)

// ============================================
// AST Node Definitions
// ============================================

/** Root node of the AST - represents an entire diagram/workspace */
export interface Program extends BaseNode {
  type: 'Program';
  /** Workspace or diagram name */
  name?: string;
  /** Version string (workspace syntax) */
  version?: string;
  /** Description (workspace syntax) */
  description?: string;
  /** Custom properties (workspace syntax) */
  properties: PropertyDefinition[];
  /** All top-level statements */
  statements: Statement[];
}

/** Property definition in workspace */
export interface PropertyDefinition extends BaseNode {
  type: 'PropertyDefinition';
  key: string;
  value: string;
}

/** Union of all top-level statement types */
export type Statement =
  | CellDefinition
  | ExternalDefinition
  | UserDefinition
  | ApplicationDefinition
  | FlowDefinition
  | ErrorNode;

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
  /** Cell description */
  description?: string;
  /** Number of cell replicas */
  replicas?: number;
  /** Primary gateway at cell boundary (control point) */
  gateway?: GatewayDefinition;
  /** All gateways (ingress/egress) at different positions */
  gateways: (GatewayDefinition | ErrorNode)[];
  /** Components inside the cell */
  components: (ComponentDefinition | ClusterDefinition | ErrorNode)[];
  /** Flow definitions for internal and external traffic patterns */
  flows: (FlowDefinition | ErrorNode)[];
  /** Nested cells for composite architectures */
  nestedCells: (CellDefinition | ErrorNode)[];
}

// ============================================
// Gateway Definition
// ============================================

/** Route definition inside gateway (new CellDL syntax) */
export interface RouteDefinition extends BaseNode {
  type: 'RouteDefinition';
  /** Route path (e.g., "/authorize") */
  path: string;
  /** Target component reference */
  target: string;
}

/** Authentication configuration for gateway */
export interface AuthConfig extends BaseNode {
  type: 'AuthConfig';
  /** Auth type: local STS or federated */
  authType: AuthType;
  /** Reference to external IDP for federated auth */
  reference?: string;
}

/** Gateway at cell boundary - the control point for cell access */
export interface GatewayDefinition extends BaseNode {
  type: 'GatewayDefinition';
  /** Gateway identifier */
  id: string;
  /** Gateway direction: ingress or egress (new CellDL syntax) */
  direction?: GatewayDirection;
  /** Position on cell boundary (north, south, east, west) */
  position?: GatewayPosition;
  /** Gateway type label */
  label?: string;
  /** Protocol (https, grpc, mtls, etc.) */
  protocol?: string;
  /** Port number */
  port?: number;
  /** Context path (e.g., "/payments") */
  context?: string;
  /** Target URL for egress gateway */
  target?: string;
  /** Single policy (egress gateway) */
  policy?: string;
  /** Endpoint types exposed by this gateway */
  exposes: EndpointType[];
  /** Security/governance policies applied at gateway */
  policies: string[];
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Routes mapping paths to components */
  routes: RouteDefinition[];
}

// ============================================
// Component Definitions
// ============================================

/** Environment variable for component (new CellDL syntax) */
export interface EnvVar extends BaseNode {
  type: 'EnvVar';
  key: string;
  value: string;
}

/** Attribute value types */
export type AttributeValue = string | number | boolean | string[];

/** Component within a cell */
export interface ComponentDefinition extends BaseNode {
  type: 'ComponentDefinition';
  /** Unique identifier for the component */
  id: string;
  /** Type of component */
  componentType: ComponentType;
  /** Docker image source (new CellDL syntax) */
  source?: string;
  /** Port number */
  port?: number;
  /** Database engine (for database components) */
  engine?: string;
  /** Storage type (for database components) */
  storage?: string;
  /** Version string (for database components) */
  version?: string;
  /** Environment variables (new CellDL syntax) */
  env: EnvVar[];
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

// ============================================
// Flow Definitions (New CellDL Syntax)
// ============================================

/** Single flow connection (source -> destination) */
export interface FlowConnection extends BaseNode {
  type: 'FlowConnection';
  /** Source reference (e.g., "PaymentCell.payment-api") */
  source: string;
  /** Destination reference */
  destination: string;
  /** Optional label */
  label?: string;
}

/** Flow block containing traffic patterns */
export interface FlowDefinition extends BaseNode {
  type: 'FlowDefinition';
  /** Flow name/identifier */
  name?: string;
  /** Flow connections */
  flows: FlowConnection[];
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

export function isFlowDefinition(node: Statement): node is FlowDefinition {
  return node.type === 'FlowDefinition';
}

export function isClusterDefinition(
  node: ComponentDefinition | ClusterDefinition
): node is ClusterDefinition {
  return node.type === 'ClusterDefinition';
}

export function isComponentDefinition(
  node: ComponentDefinition | ClusterDefinition | ErrorNode
): node is ComponentDefinition {
  return node.type === 'ComponentDefinition';
}

export function isErrorNode(node: BaseNode): node is ErrorNode {
  return node.type === 'ErrorNode';
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

/**
 * Cell Diagrams AST Type Definitions
 *
 * This module defines the Abstract Syntax Tree structure for Cell Diagrams DSL.
 * The AST represents the semantic structure of a cell-based architecture diagram.
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

/** Types of components that can exist within a cell */
export type ComponentType =
  | 'microservice'
  | 'function'
  | 'database'
  | 'gateway'
  | 'service'
  | 'broker'
  | 'cache'
  | 'legacy'
  | 'esb'
  | 'idp';

/** Short codes for component types used in DSL syntax */
export type ComponentTypeShort =
  | 'ms'      // microservice
  | 'fn'      // function
  | 'db'      // database
  | 'gw'      // gateway
  | 'svc'     // service
  | 'broker'  // message broker
  | 'cache'   // cache
  | 'legacy'  // legacy system
  | 'esb'     // enterprise service bus
  | 'idp';    // identity provider

/** Cell classification types */
export type CellType =
  | 'logic'       // Business logic cell
  | 'integration' // Integration/adapter cell
  | 'legacy'      // Legacy wrapper cell
  | 'data'        // Data management cell
  | 'security'    // Security/identity cell
  | 'channel'     // Channel/presentation cell
  | 'external';   // External system (not really a cell)

/** Types of exposed endpoints */
export type EndpointType =
  | 'api'     // REST/GraphQL API
  | 'event'   // Event/message
  | 'stream'; // Data stream

/** Connection direction for traffic flow */
export type ConnectionDirection =
  | 'northbound'  // External -> Cell
  | 'southbound'  // Cell -> External
  | 'eastbound'   // Cell -> Cell (same tier)
  | 'westbound';  // Cell -> Cell (same tier)

// ============================================
// AST Node Definitions
// ============================================

/** Root node of the AST */
export interface Program extends BaseNode {
  type: 'Program';
  statements: Statement[];
}

/** Union of all top-level statement types */
export type Statement =
  | CellDefinition
  | ExternalDefinition
  | UserDefinition
  | Connection;

/** Cell definition with components and connections */
export interface CellDefinition extends BaseNode {
  type: 'CellDefinition';
  /** Unique identifier for the cell */
  id: string;
  /** Human-readable display name */
  name?: string;
  /** Cell classification */
  cellType?: CellType;
  /** Components within the cell */
  components: ComponentDefinition[];
  /** Internal connections between components */
  internalConnections: InternalConnection[];
  /** Exposed endpoints (gateways) */
  exposedEndpoints: EndpointDefinition[];
}

/** Component within a cell */
export interface ComponentDefinition extends BaseNode {
  type: 'ComponentDefinition';
  /** Unique identifier for the component */
  id: string;
  /** Type of component */
  componentType: ComponentType;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Connection between components within a cell */
export interface InternalConnection extends BaseNode {
  type: 'InternalConnection';
  /** Source component ID */
  source: string;
  /** Target component ID */
  target: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Exposed endpoint definition */
export interface EndpointDefinition extends BaseNode {
  type: 'EndpointDefinition';
  /** Type of endpoint */
  endpointType: EndpointType;
  /** Reference to the component that handles this endpoint */
  componentRef: string;
  /** Additional attributes (e.g., path, protocol) */
  attributes: Attribute[];
}

/** External system definition */
export interface ExternalDefinition extends BaseNode {
  type: 'ExternalDefinition';
  /** Unique identifier */
  id: string;
  /** Display name */
  name?: string;
  /** Type of external system (saas, partner, etc.) */
  externalType?: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** User/actor definition */
export interface UserDefinition extends BaseNode {
  type: 'UserDefinition';
  /** Unique identifier */
  id: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Inter-cell or user-to-cell connection */
export interface Connection extends BaseNode {
  type: 'Connection';
  /** Source cell/user/external ID */
  source: string;
  /** Target cell/external ID */
  target: string;
  /** Additional attributes */
  attributes: Attribute[];
}

/** Key-value attribute */
export interface Attribute extends BaseNode {
  type: 'Attribute';
  /** Attribute key */
  key: string;
  /** Attribute value (optional for boolean flags) */
  value?: string | number | boolean;
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

export function isConnection(node: Statement): node is Connection {
  return node.type === 'Connection';
}

// ============================================
// Utility Types
// ============================================

/** Map from short code to full component type */
export const COMPONENT_TYPE_MAP: Record<ComponentTypeShort, ComponentType> = {
  ms: 'microservice',
  fn: 'function',
  db: 'database',
  gw: 'gateway',
  svc: 'service',
  broker: 'broker',
  cache: 'cache',
  legacy: 'legacy',
  esb: 'esb',
  idp: 'idp',
};

/** Map from full component type to short code */
export const COMPONENT_TYPE_REVERSE_MAP: Record<ComponentType, ComponentTypeShort> = {
  microservice: 'ms',
  function: 'fn',
  database: 'db',
  gateway: 'gw',
  service: 'svc',
  broker: 'broker',
  cache: 'cache',
  legacy: 'legacy',
  esb: 'esb',
  idp: 'idp',
};

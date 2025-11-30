/**
 * Cell Diagrams CST Visitor
 *
 * Transforms the Concrete Syntax Tree (CST) into an Abstract Syntax Tree (AST).
 * Complete rewrite for Cell-Based Architecture DSL.
 */

import { CstNode, IToken } from 'chevrotain';
import { getBaseCstVisitorConstructor } from './parser';
import {
  Program,
  Statement,
  CellDefinition,
  ComponentDefinition,
  ClusterDefinition,
  InternalConnection,
  GatewayDefinition,
  AuthConfig,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  Connection,
  ConnectionsBlock,
  ConnectionEndpoint,
  ComponentType,
  CellType,
  EndpointType,
  ExternalType,
  UserType,
  ConnectionDirection,
  AuthType,
  AttributeValue,
  COMPONENT_TYPE_ALIAS_MAP,
  ComponentTypeAlias,
} from '../ast/types';

// ============================================
// Helper Functions
// ============================================

function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function tokenToComponentType(tokenName: string): ComponentType {
  // Handle aliases
  const lowerName = tokenName.toLowerCase();
  if (lowerName in COMPONENT_TYPE_ALIAS_MAP) {
    return COMPONENT_TYPE_ALIAS_MAP[lowerName as ComponentTypeAlias];
  }

  // Map token names to component types
  const mapping: Record<string, ComponentType> = {
    'Microservice': 'microservice',
    'Function': 'function',
    'Database': 'database',
    'Broker': 'broker',
    'Cache': 'cache',
    'Gateway': 'gateway',
    'Idp': 'idp',
    'Sts': 'sts',
    'Userstore': 'userstore',
    'Esb': 'esb',
    'Adapter': 'adapter',
    'Transformer': 'transformer',
    'Webapp': 'webapp',
    'Mobile': 'mobile',
    'Iot': 'iot',
    'LegacyType': 'legacy',
    'Ms': 'microservice',
    'Fn': 'function',
    'Db': 'database',
  };

  return mapping[tokenName] || 'microservice';
}

// ============================================
// Visitor Implementation
// ============================================

const BaseCstVisitor = getBaseCstVisitorConstructor();

class CellDiagramsVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  // ========================================
  // Top-Level Rules
  // ========================================

  program(ctx: {
    diagramDefinition?: CstNode[];
    statement?: CstNode[];
  }): Program {
    let name: string | undefined;
    const statements: Statement[] = [];

    if (ctx.diagramDefinition?.[0]) {
      const result = this.visit(ctx.diagramDefinition[0]) as {
        name: string;
        statements: Statement[];
      };
      name = result.name;
      statements.push(...result.statements);
    } else if (ctx.statement) {
      for (const stmtNode of ctx.statement) {
        const stmt = this.visit(stmtNode) as Statement | null;
        if (stmt) {
          statements.push(stmt);
        }
      }
    }

    return {
      type: 'Program',
      ...(name !== undefined && { name }),
      statements,
    };
  }

  diagramDefinition(ctx: {
    diagramName: IToken[];
    statement?: CstNode[];
  }): { name: string; statements: Statement[] } {
    const raw = ctx.diagramName[0]!.image;
    // Handle both Identifier (no quotes) and StringLiteral (with quotes)
    const name = raw.startsWith('"') ? unescapeString(raw.slice(1, -1)) : raw;
    const statements: Statement[] = [];

    if (ctx.statement) {
      for (const stmtNode of ctx.statement) {
        const stmt = this.visit(stmtNode) as Statement | null;
        if (stmt) {
          statements.push(stmt);
        }
      }
    }

    return { name, statements };
  }

  statement(ctx: {
    cellDefinition?: CstNode[];
    externalDefinition?: CstNode[];
    userDefinition?: CstNode[];
    applicationDefinition?: CstNode[];
    connectionsBlock?: CstNode[];
  }): Statement | null {
    if (ctx.cellDefinition?.[0]) {
      return this.visit(ctx.cellDefinition[0]) as CellDefinition;
    }
    if (ctx.externalDefinition?.[0]) {
      return this.visit(ctx.externalDefinition[0]) as ExternalDefinition;
    }
    if (ctx.userDefinition?.[0]) {
      return this.visit(ctx.userDefinition[0]) as UserDefinition;
    }
    if (ctx.applicationDefinition?.[0]) {
      return this.visit(ctx.applicationDefinition[0]) as ApplicationDefinition;
    }
    if (ctx.connectionsBlock?.[0]) {
      return this.visit(ctx.connectionsBlock[0]) as ConnectionsBlock;
    }
    return null;
  }

  // ========================================
  // Cell Definition
  // ========================================

  cellDefinition(ctx: {
    cellId: IToken[];
    cellBody?: CstNode[];
  }): CellDefinition {
    const id = ctx.cellId[0]!.image;
    let label: string | undefined;
    let cellType: CellType = 'logic'; // Default
    let gateway: GatewayDefinition | undefined;
    const components: (ComponentDefinition | ClusterDefinition)[] = [];
    const connections: InternalConnection[] = [];

    if (ctx.cellBody) {
      for (const bodyNode of ctx.cellBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'cellType':
              cellType = result.value as CellType;
              break;
            case 'gateway':
              gateway = result.value as GatewayDefinition;
              break;
            case 'components':
              components.push(...(result.value as (ComponentDefinition | ClusterDefinition)[]));
              break;
            case 'cluster':
              components.push(result.value as ClusterDefinition);
              break;
            case 'connections':
              connections.push(...(result.value as InternalConnection[]));
              break;
          }
        }
      }
    }

    return {
      type: 'CellDefinition',
      id,
      ...(label !== undefined && { label }),
      cellType,
      ...(gateway !== undefined && { gateway }),
      components,
      connections,
    };
  }

  cellBody(ctx: {
    labelProperty?: CstNode[];
    typeProperty?: CstNode[];
    gatewayBlock?: CstNode[];
    componentsBlock?: CstNode[];
    clusterDefinition?: CstNode[];
    connectionsBlock?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) {
      const value = this.visit(ctx.labelProperty[0]) as string;
      return { _type: 'label', value };
    }
    if (ctx.typeProperty?.[0]) {
      const value = this.visit(ctx.typeProperty[0]) as CellType;
      return { _type: 'cellType', value };
    }
    if (ctx.gatewayBlock?.[0]) {
      const value = this.visit(ctx.gatewayBlock[0]) as GatewayDefinition;
      return { _type: 'gateway', value };
    }
    if (ctx.componentsBlock?.[0]) {
      const value = this.visit(ctx.componentsBlock[0]) as (ComponentDefinition | ClusterDefinition)[];
      return { _type: 'components', value };
    }
    if (ctx.clusterDefinition?.[0]) {
      const value = this.visit(ctx.clusterDefinition[0]) as ClusterDefinition;
      return { _type: 'cluster', value };
    }
    if (ctx.connectionsBlock?.[0]) {
      // Internal connections block
      const connectionsBlock = this.visit(ctx.connectionsBlock[0]) as ConnectionsBlock;
      const internalConns: InternalConnection[] = connectionsBlock.connections.map(conn => ({
        type: 'InternalConnection' as const,
        source: conn.source.entity,
        target: conn.target.entity,
      }));
      return { _type: 'connections', value: internalConns };
    }
    return null;
  }

  labelProperty(ctx: { labelValue: IToken[] }): string {
    const raw = ctx.labelValue[0]!.image;
    return unescapeString(raw.slice(1, -1));
  }

  typeProperty(ctx: { cellTypeValue: CstNode[] }): CellType {
    return this.visit(ctx.cellTypeValue[0]!) as CellType;
  }

  cellTypeValue(ctx: { cellType: IToken[] }): CellType {
    const token = ctx.cellType[0]!;
    const mapping: Record<string, CellType> = {
      'Logic': 'logic',
      'Integration': 'integration',
      'Data': 'data',
      'Security': 'security',
      'Channel': 'channel',
      'LegacyType': 'legacy',
    };
    return mapping[token.tokenType.name] || 'logic';
  }

  // ========================================
  // Gateway Definition
  // ========================================

  gatewayBlock(ctx: {
    gatewayId?: IToken[];
    gatewayProperty?: CstNode[];
  }): GatewayDefinition {
    const id = ctx.gatewayId?.[0]?.image || 'gateway';
    let exposes: EndpointType[] = [];
    let policies: string[] | undefined;
    let auth: AuthConfig | undefined;

    if (ctx.gatewayProperty) {
      for (const propNode of ctx.gatewayProperty) {
        const result = this.visit(propNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'exposes':
              exposes = result.value as EndpointType[];
              break;
            case 'policies':
              policies = result.value as string[];
              break;
            case 'auth':
              auth = result.value as AuthConfig;
              break;
          }
        }
      }
    }

    return {
      type: 'GatewayDefinition',
      id,
      exposes,
      ...(policies !== undefined && { policies }),
      ...(auth !== undefined && { auth }),
    };
  }

  gatewayProperty(ctx: {
    exposesProperty?: CstNode[];
    policiesProperty?: CstNode[];
    authProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.exposesProperty?.[0]) {
      const value = this.visit(ctx.exposesProperty[0]) as EndpointType[];
      return { _type: 'exposes', value };
    }
    if (ctx.policiesProperty?.[0]) {
      const value = this.visit(ctx.policiesProperty[0]) as string[];
      return { _type: 'policies', value };
    }
    if (ctx.authProperty?.[0]) {
      const value = this.visit(ctx.authProperty[0]) as AuthConfig;
      return { _type: 'auth', value };
    }
    return null;
  }

  exposesProperty(ctx: { endpointType: CstNode[] }): EndpointType[] {
    return ctx.endpointType.map(node => this.visit(node) as EndpointType);
  }

  policiesProperty(ctx: { policyValue: CstNode[] }): string[] {
    return ctx.policyValue.map(node => this.visit(node) as string);
  }

  policyValue(ctx: { policy: IToken[] }): string {
    const raw = ctx.policy[0]!.image;
    if (raw.startsWith('"')) {
      return unescapeString(raw.slice(1, -1));
    }
    return raw;
  }

  authProperty(ctx: {
    authType: IToken[];
    entityReference?: CstNode[];
  }): AuthConfig {
    const token = ctx.authType[0]!;
    const authType: AuthType = token.tokenType.name === 'LocalSts' ? 'local-sts' : 'federated';

    let reference: string | undefined;
    if (ctx.entityReference?.[0]) {
      reference = this.visit(ctx.entityReference[0]) as string;
    }

    return {
      type: 'AuthConfig',
      authType,
      ...(reference !== undefined && { reference }),
    };
  }

  endpointType(ctx: { endpoint: IToken[] }): EndpointType {
    const token = ctx.endpoint[0]!;
    const mapping: Record<string, EndpointType> = {
      'Api': 'api',
      'Events': 'events',
      'Stream': 'stream',
    };
    return mapping[token.tokenType.name] || 'api';
  }

  // ========================================
  // Components Block
  // ========================================

  componentsBlock(ctx: {
    clusterDefinition?: CstNode[];
    componentDefinition?: CstNode[];
  }): (ComponentDefinition | ClusterDefinition)[] {
    const result: (ComponentDefinition | ClusterDefinition)[] = [];

    if (ctx.clusterDefinition) {
      for (const node of ctx.clusterDefinition) {
        result.push(this.visit(node) as ClusterDefinition);
      }
    }
    if (ctx.componentDefinition) {
      for (const node of ctx.componentDefinition) {
        result.push(this.visit(node) as ComponentDefinition);
      }
    }

    return result;
  }

  componentDefinition(ctx: {
    componentType: CstNode[];
    componentId: IToken[];
    attributeBlock?: CstNode[];
  }): ComponentDefinition {
    const componentType = this.visit(ctx.componentType[0]!) as ComponentType;
    const id = ctx.componentId[0]!.image;
    const attributes: Record<string, AttributeValue> = {};
    let sidecars: string[] | undefined;

    if (ctx.attributeBlock?.[0]) {
      const attrs = this.visit(ctx.attributeBlock[0]) as Record<string, AttributeValue>;
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'sidecar' && Array.isArray(value)) {
          sidecars = value as string[];
        } else {
          attributes[key] = value;
        }
      }
    }

    return {
      type: 'ComponentDefinition',
      id,
      componentType,
      attributes,
      ...(sidecars !== undefined && { sidecars }),
    };
  }

  componentType(ctx: { compType: IToken[] }): ComponentType {
    const token = ctx.compType[0]!;
    return tokenToComponentType(token.tokenType.name);
  }

  clusterDefinition(ctx: {
    clusterId: IToken[];
    clusterBody?: CstNode[];
  }): ClusterDefinition {
    const id = ctx.clusterId[0]!.image;
    let clusterType: string | undefined;
    let replicas: number | undefined;
    const components: ComponentDefinition[] = [];

    if (ctx.clusterBody) {
      for (const bodyNode of ctx.clusterBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'clusterType':
              clusterType = result.value as string;
              break;
            case 'replicas':
              replicas = result.value as number;
              break;
            case 'component':
              components.push(result.value as ComponentDefinition);
              break;
          }
        }
      }
    }

    return {
      type: 'ClusterDefinition',
      id,
      ...(clusterType !== undefined && { clusterType }),
      ...(replicas !== undefined && { replicas }),
      components,
    };
  }

  clusterBody(ctx: {
    clusterTypeProperty?: CstNode[];
    replicasProperty?: CstNode[];
    componentDefinition?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.clusterTypeProperty?.[0]) {
      const value = this.visit(ctx.clusterTypeProperty[0]) as string;
      return { _type: 'clusterType', value };
    }
    if (ctx.replicasProperty?.[0]) {
      const value = this.visit(ctx.replicasProperty[0]) as number;
      return { _type: 'replicas', value };
    }
    if (ctx.componentDefinition?.[0]) {
      const value = this.visit(ctx.componentDefinition[0]) as ComponentDefinition;
      return { _type: 'component', value };
    }
    return null;
  }

  clusterTypeProperty(ctx: { componentType: CstNode[] }): string {
    return this.visit(ctx.componentType[0]!) as string;
  }

  replicasProperty(ctx: { replicaCount: IToken[] }): number {
    return parseInt(ctx.replicaCount[0]!.image, 10);
  }

  // ========================================
  // Attribute Block
  // ========================================

  attributeBlock(ctx: { property?: CstNode[] }): Record<string, AttributeValue> {
    const result: Record<string, AttributeValue> = {};

    if (ctx.property) {
      for (const propNode of ctx.property) {
        const [key, value] = this.visit(propNode) as [string, AttributeValue];
        result[key] = value;
      }
    }

    return result;
  }

  property(ctx: {
    propertyKey: CstNode[];
    propertyValue: CstNode[];
  }): [string, AttributeValue] {
    const key = this.visit(ctx.propertyKey[0]!) as string;
    const value = this.visit(ctx.propertyValue[0]!) as AttributeValue;
    return [key, value];
  }

  propertyKey(ctx: { key: IToken[] }): string {
    return ctx.key[0]!.image;
  }

  propertyValue(ctx: {
    value?: IToken[];
    arrayValue?: CstNode[];
    identifierValue?: CstNode[];
  }): AttributeValue {
    if (ctx.value?.[0]) {
      const token = ctx.value[0];
      const tokenName = token.tokenType.name;

      if (tokenName === 'StringLiteral') {
        return unescapeString(token.image.slice(1, -1));
      }
      if (tokenName === 'NumberLiteral') {
        const num = token.image;
        return num.includes('.') ? parseFloat(num) : parseInt(num, 10);
      }
      if (tokenName === 'True') {
        return true;
      }
      if (tokenName === 'False') {
        return false;
      }
    }
    if (ctx.arrayValue?.[0]) {
      return this.visit(ctx.arrayValue[0]) as string[];
    }
    if (ctx.identifierValue?.[0]) {
      return this.visit(ctx.identifierValue[0]) as string;
    }
    return '';
  }

  arrayValue(ctx: { arrayElement?: CstNode[] }): string[] {
    if (!ctx.arrayElement) {
      return [];
    }
    return ctx.arrayElement.map(node => this.visit(node) as string);
  }

  arrayElement(ctx: { element: IToken[] }): string {
    const raw = ctx.element[0]!.image;
    if (raw.startsWith('"')) {
      return unescapeString(raw.slice(1, -1));
    }
    return raw;
  }

  identifierValue(ctx: { idValue: IToken[] }): string {
    return ctx.idValue[0]!.image;
  }

  // ========================================
  // Connections Block
  // ========================================

  connectionsBlock(ctx: { connection?: CstNode[] }): ConnectionsBlock {
    const connections: Connection[] = [];

    if (ctx.connection) {
      for (const connNode of ctx.connection) {
        connections.push(this.visit(connNode) as Connection);
      }
    }

    return {
      type: 'ConnectionsBlock',
      connections,
    };
  }

  connection(ctx: {
    connectionDirection?: CstNode[];
    source: CstNode[];
    target: CstNode[];
    connectionAttributes?: CstNode[];
  }): Connection {
    let direction: ConnectionDirection | undefined;
    if (ctx.connectionDirection?.[0]) {
      direction = this.visit(ctx.connectionDirection[0]) as ConnectionDirection;
    }

    const source = this.visit(ctx.source[0]!) as ConnectionEndpoint;
    const target = this.visit(ctx.target[0]!) as ConnectionEndpoint;

    // Parse connection attributes which can contain direction flags and key-value properties
    const attributes: Record<string, AttributeValue> = {};
    if (ctx.connectionAttributes?.[0]) {
      const result = this.visit(ctx.connectionAttributes[0]) as {
        direction?: ConnectionDirection;
        attributes: Record<string, AttributeValue>;
      };
      if (result.direction && !direction) {
        direction = result.direction;
      }
      Object.assign(attributes, result.attributes);
    }

    return {
      type: 'Connection',
      ...(direction !== undefined && { direction }),
      source,
      target,
      attributes,
    };
  }

  connectionAttributes(ctx: {
    connectionAttr?: CstNode[];
  }): { direction?: ConnectionDirection; attributes: Record<string, AttributeValue> } {
    let direction: ConnectionDirection | undefined;
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.connectionAttr) {
      for (const attrNode of ctx.connectionAttr) {
        const result = this.visit(attrNode) as
          | { _type: 'direction'; value: ConnectionDirection }
          | { _type: 'property'; key: string; value: AttributeValue };

        if (result._type === 'direction') {
          direction = result.value;
        } else if (result._type === 'property') {
          attributes[result.key] = result.value;
        }
      }
    }

    return { direction, attributes };
  }

  connectionAttr(ctx: {
    connectionDirection?: CstNode[];
    property?: CstNode[];
  }): { _type: 'direction'; value: ConnectionDirection } | { _type: 'property'; key: string; value: AttributeValue } {
    if (ctx.connectionDirection?.[0]) {
      const value = this.visit(ctx.connectionDirection[0]) as ConnectionDirection;
      return { _type: 'direction', value };
    }
    if (ctx.property?.[0]) {
      const [key, value] = this.visit(ctx.property[0]) as [string, AttributeValue];
      return { _type: 'property', key, value };
    }
    // Default fallback
    return { _type: 'property', key: '', value: '' };
  }

  connectionDirection(ctx: { direction: IToken[] }): ConnectionDirection {
    const token = ctx.direction[0]!;
    const mapping: Record<string, ConnectionDirection> = {
      'Northbound': 'northbound',
      'Southbound': 'southbound',
      'Eastbound': 'eastbound',
      'Westbound': 'westbound',
    };
    return mapping[token.tokenType.name] || 'eastbound';
  }

  connectionEndpoint(ctx: {
    entity: IToken[];
    component?: IToken[];
  }): ConnectionEndpoint {
    const entity = ctx.entity[0]!.image;
    const component = ctx.component?.[0]?.image;

    return {
      type: 'ConnectionEndpoint',
      entity,
      ...(component !== undefined && { component }),
    };
  }

  entityReference(ctx: {
    entity: IToken[];
    component?: IToken[];
  }): string {
    const entity = ctx.entity[0]!.image;
    const component = ctx.component?.[0]?.image;
    return component ? `${entity}.${component}` : entity;
  }

  // ========================================
  // External Definition
  // ========================================

  externalDefinition(ctx: {
    externalId: IToken[];
    externalBody?: CstNode[];
  }): ExternalDefinition {
    const id = ctx.externalId[0]!.image;
    let label: string | undefined;
    let externalType: ExternalType = 'saas'; // Default
    let provides: EndpointType[] | undefined;

    if (ctx.externalBody) {
      for (const bodyNode of ctx.externalBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'externalType':
              externalType = result.value as ExternalType;
              break;
            case 'provides':
              provides = result.value as EndpointType[];
              break;
          }
        }
      }
    }

    return {
      type: 'ExternalDefinition',
      id,
      ...(label !== undefined && { label }),
      externalType,
      ...(provides !== undefined && { provides }),
    };
  }

  externalBody(ctx: {
    labelProperty?: CstNode[];
    externalTypeProperty?: CstNode[];
    providesProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) {
      const value = this.visit(ctx.labelProperty[0]) as string;
      return { _type: 'label', value };
    }
    if (ctx.externalTypeProperty?.[0]) {
      const value = this.visit(ctx.externalTypeProperty[0]) as ExternalType;
      return { _type: 'externalType', value };
    }
    if (ctx.providesProperty?.[0]) {
      const value = this.visit(ctx.providesProperty[0]) as EndpointType[];
      return { _type: 'provides', value };
    }
    return null;
  }

  externalTypeProperty(ctx: { externalType: IToken[] }): ExternalType {
    const token = ctx.externalType[0]!;
    const mapping: Record<string, ExternalType> = {
      'Saas': 'saas',
      'Partner': 'partner',
      'Enterprise': 'enterprise',
    };
    return mapping[token.tokenType.name] || 'saas';
  }

  providesProperty(ctx: { endpointType: CstNode[] }): EndpointType[] {
    return ctx.endpointType.map(node => this.visit(node) as EndpointType);
  }

  // ========================================
  // User Definition
  // ========================================

  userDefinition(ctx: {
    userId: IToken[];
    userBody?: CstNode[];
  }): UserDefinition {
    const id = ctx.userId[0]!.image;
    let label: string | undefined;
    let userType: UserType = 'external'; // Default
    let channels: string[] | undefined;

    if (ctx.userBody) {
      for (const bodyNode of ctx.userBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'userType':
              userType = result.value as UserType;
              break;
            case 'channels':
              channels = result.value as string[];
              break;
          }
        }
      }
    }

    return {
      type: 'UserDefinition',
      id,
      ...(label !== undefined && { label }),
      userType,
      ...(channels !== undefined && { channels }),
    };
  }

  userBody(ctx: {
    labelProperty?: CstNode[];
    userTypeProperty?: CstNode[];
    channelsProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) {
      const value = this.visit(ctx.labelProperty[0]) as string;
      return { _type: 'label', value };
    }
    if (ctx.userTypeProperty?.[0]) {
      const value = this.visit(ctx.userTypeProperty[0]) as UserType;
      return { _type: 'userType', value };
    }
    if (ctx.channelsProperty?.[0]) {
      const value = this.visit(ctx.channelsProperty[0]) as string[];
      return { _type: 'channels', value };
    }
    return null;
  }

  userTypeProperty(ctx: { userType: IToken[] }): UserType {
    const token = ctx.userType[0]!;
    const mapping: Record<string, UserType> = {
      'External': 'external',
      'Internal': 'internal',
      'System': 'system',
    };
    return mapping[token.tokenType.name] || 'external';
  }

  channelsProperty(ctx: { channelValue: CstNode[] }): string[] {
    return ctx.channelValue.map(node => this.visit(node) as string);
  }

  channelValue(ctx: { channel: IToken[] }): string {
    const raw = ctx.channel[0]!.image;
    if (raw.startsWith('"')) {
      return unescapeString(raw.slice(1, -1));
    }
    return raw;
  }

  // ========================================
  // Application Definition
  // ========================================

  applicationDefinition(ctx: {
    applicationId: IToken[];
    applicationBody?: CstNode[];
  }): ApplicationDefinition {
    const id = ctx.applicationId[0]!.image;
    let label: string | undefined;
    let version: string | undefined;
    let cells: string[] = [];
    let gateway: GatewayDefinition | undefined;

    if (ctx.applicationBody) {
      for (const bodyNode of ctx.applicationBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'version':
              version = result.value as string;
              break;
            case 'cells':
              cells = result.value as string[];
              break;
            case 'gateway':
              gateway = result.value as GatewayDefinition;
              break;
          }
        }
      }
    }

    return {
      type: 'ApplicationDefinition',
      id,
      ...(label !== undefined && { label }),
      ...(version !== undefined && { version }),
      cells,
      ...(gateway !== undefined && { gateway }),
    };
  }

  applicationBody(ctx: {
    labelProperty?: CstNode[];
    versionProperty?: CstNode[];
    cellsProperty?: CstNode[];
    gatewayBlock?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) {
      const value = this.visit(ctx.labelProperty[0]) as string;
      return { _type: 'label', value };
    }
    if (ctx.versionProperty?.[0]) {
      const value = this.visit(ctx.versionProperty[0]) as string;
      return { _type: 'version', value };
    }
    if (ctx.cellsProperty?.[0]) {
      const value = this.visit(ctx.cellsProperty[0]) as string[];
      return { _type: 'cells', value };
    }
    if (ctx.gatewayBlock?.[0]) {
      const value = this.visit(ctx.gatewayBlock[0]) as GatewayDefinition;
      return { _type: 'gateway', value };
    }
    return null;
  }

  versionProperty(ctx: { versionValue: IToken[] }): string {
    const raw = ctx.versionValue[0]!.image;
    return unescapeString(raw.slice(1, -1));
  }

  cellsProperty(ctx: { cellRef: IToken[] }): string[] {
    return ctx.cellRef.map(token => token.image);
  }
}

// ============================================
// Singleton Visitor Instance
// ============================================

export const visitorInstance = new CellDiagramsVisitor();

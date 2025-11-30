/**
 * CellDL CST Visitor
 *
 * Transforms the Concrete Syntax Tree (CST) into an Abstract Syntax Tree (AST).
 * Supports the new CellDL specification for Cell-Based Architecture.
 */

import { CstNode, IToken } from 'chevrotain';
import { getBaseCstVisitorConstructor } from './parser';
import {
  Program,
  Statement,
  PropertyDefinition,
  CellDefinition,
  ComponentDefinition,
  ClusterDefinition,
  InternalConnection,
  GatewayDefinition,
  GatewayDirection,
  RouteDefinition,
  AuthConfig,
  EnvVar,
  ExternalDefinition,
  UserDefinition,
  ApplicationDefinition,
  Connection,
  ConnectionsBlock,
  ConnectionEndpoint,
  FlowDefinition,
  FlowConnection,
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

function extractStringValue(token: IToken): string {
  const raw = token.image;
  if (raw.startsWith('"')) {
    return unescapeString(raw.slice(1, -1));
  }
  return raw;
}

function tokenToComponentType(tokenName: string): ComponentType {
  const lowerName = tokenName.toLowerCase();
  if (lowerName in COMPONENT_TYPE_ALIAS_MAP) {
    return COMPONENT_TYPE_ALIAS_MAP[lowerName as ComponentTypeAlias];
  }

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
    workspaceBlock?: CstNode[];
    diagramDefinition?: CstNode[];
    statement?: CstNode[];
  }): Program {
    // Handle workspace block (new CellDL syntax)
    if (ctx.workspaceBlock?.[0]) {
      return this.visit(ctx.workspaceBlock[0]) as Program;
    }

    // Handle diagram block (legacy syntax)
    if (ctx.diagramDefinition?.[0]) {
      const result = this.visit(ctx.diagramDefinition[0]) as {
        name: string;
        statements: Statement[];
      };
      return {
        type: 'Program',
        name: result.name,
        properties: [],
        statements: result.statements,
      };
    }

    // Handle bare statements
    const statements: Statement[] = [];
    if (ctx.statement) {
      for (const stmtNode of ctx.statement) {
        const stmt = this.visit(stmtNode) as Statement | null;
        if (stmt) {
          statements.push(stmt);
        }
      }
    }

    return {
      type: 'Program',
      properties: [],
      statements,
    };
  }

  workspaceBlock(ctx: {
    workspaceName: IToken[];
    workspaceBody?: CstNode[];
  }): Program {
    const name = extractStringValue(ctx.workspaceName[0]!);
    let version: string | undefined;
    let description: string | undefined;
    const properties: PropertyDefinition[] = [];
    const statements: Statement[] = [];

    if (ctx.workspaceBody) {
      for (const bodyNode of ctx.workspaceBody) {
        const result = this.visit(bodyNode) as {
          _type: string;
          value: unknown;
        } | null;

        if (result) {
          switch (result._type) {
            case 'version':
              version = result.value as string;
              break;
            case 'description':
              description = result.value as string;
              break;
            case 'property':
              properties.push(result.value as PropertyDefinition);
              break;
            case 'statement':
              statements.push(result.value as Statement);
              break;
          }
        }
      }
    }

    return {
      type: 'Program',
      name,
      ...(version && { version }),
      ...(description && { description }),
      properties,
      statements,
    };
  }

  workspaceBody(ctx: {
    versionStatement?: CstNode[];
    descriptionStatement?: CstNode[];
    propertyStatement?: CstNode[];
    statement?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.versionStatement?.[0]) {
      return { _type: 'version', value: this.visit(ctx.versionStatement[0]) };
    }
    if (ctx.descriptionStatement?.[0]) {
      return { _type: 'description', value: this.visit(ctx.descriptionStatement[0]) };
    }
    if (ctx.propertyStatement?.[0]) {
      return { _type: 'property', value: this.visit(ctx.propertyStatement[0]) };
    }
    if (ctx.statement?.[0]) {
      return { _type: 'statement', value: this.visit(ctx.statement[0]) };
    }
    return null;
  }

  versionStatement(ctx: { versionValue: IToken[] }): string {
    return extractStringValue(ctx.versionValue[0]!);
  }

  descriptionStatement(ctx: { descriptionValue: IToken[] }): string {
    return extractStringValue(ctx.descriptionValue[0]!);
  }

  propertyStatement(ctx: {
    propertyKey: IToken[];
    propertyValue: IToken[];
  }): PropertyDefinition {
    return {
      type: 'PropertyDefinition',
      key: extractStringValue(ctx.propertyKey[0]!),
      value: extractStringValue(ctx.propertyValue[0]!),
    };
  }

  diagramDefinition(ctx: {
    diagramName: IToken[];
    statement?: CstNode[];
  }): { name: string; statements: Statement[] } {
    const name = extractStringValue(ctx.diagramName[0]!);
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
    flowBlock?: CstNode[];
  }): Statement | null {
    if (ctx.cellDefinition?.[0]) return this.visit(ctx.cellDefinition[0]) as CellDefinition;
    if (ctx.externalDefinition?.[0]) return this.visit(ctx.externalDefinition[0]) as ExternalDefinition;
    if (ctx.userDefinition?.[0]) return this.visit(ctx.userDefinition[0]) as UserDefinition;
    if (ctx.applicationDefinition?.[0]) return this.visit(ctx.applicationDefinition[0]) as ApplicationDefinition;
    if (ctx.connectionsBlock?.[0]) return this.visit(ctx.connectionsBlock[0]) as ConnectionsBlock;
    if (ctx.flowBlock?.[0]) return this.visit(ctx.flowBlock[0]) as FlowDefinition;
    return null;
  }

  // ========================================
  // Cell Definition
  // ========================================

  cellDefinition(ctx: {
    cellId: IToken[];
    inlineType?: CstNode[];
    cellBody?: CstNode[];
  }): CellDefinition {
    const cellIdValue = extractStringValue(ctx.cellId[0]!);
    // In new CellDL syntax, the quoted string is the label and ID is derived from it
    // Convert label to ID: "Order Management" -> "OrderManagement" or just use the label
    const id = cellIdValue.replace(/\s+/g, '');
    let label: string | undefined = cellIdValue;
    let cellType: CellType = 'logic';
    let description: string | undefined;
    let replicas: number | undefined;
    let gateway: GatewayDefinition | undefined;
    const gateways: GatewayDefinition[] = [];
    const components: (ComponentDefinition | ClusterDefinition)[] = [];
    const connections: InternalConnection[] = [];
    const flows: FlowDefinition[] = [];
    const nestedCells: CellDefinition[] = [];

    // Handle inline type: cell "Name" type:logic { }
    if (ctx.inlineType?.[0]) {
      cellType = this.visit(ctx.inlineType[0]) as CellType;
    }

    if (ctx.cellBody) {
      for (const bodyNode of ctx.cellBody) {
        const result = this.visit(bodyNode) as { _type: string; value: unknown } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'cellType':
              cellType = result.value as CellType;
              break;
            case 'description':
              description = result.value as string;
              break;
            case 'replicas':
              replicas = result.value as number;
              break;
            case 'gateway':
              const gw = result.value as GatewayDefinition;
              gateways.push(gw);
              if (!gateway) gateway = gw;
              break;
            case 'components':
              components.push(...(result.value as (ComponentDefinition | ClusterDefinition)[]));
              break;
            case 'component':
              components.push(result.value as ComponentDefinition);
              break;
            case 'cluster':
              components.push(result.value as ClusterDefinition);
              break;
            case 'connections':
              connections.push(...(result.value as InternalConnection[]));
              break;
            case 'flow':
              flows.push(result.value as FlowDefinition);
              break;
            case 'nestedCell':
              nestedCells.push(result.value as CellDefinition);
              break;
          }
        }
      }
    }

    return {
      type: 'CellDefinition',
      id,
      ...(label && { label }),
      cellType,
      ...(description && { description }),
      ...(replicas !== undefined && { replicas }),
      ...(gateway && { gateway }),
      gateways,
      components,
      connections,
      flows,
      nestedCells,
    };
  }

  cellBody(ctx: {
    labelProperty?: CstNode[];
    typeProperty?: CstNode[];
    descriptionProperty?: CstNode[];
    replicasProperty?: CstNode[];
    gatewayBlock?: CstNode[];
    componentsBlock?: CstNode[];
    componentBlock?: CstNode[];
    databaseBlock?: CstNode[];
    functionBlock?: CstNode[];
    legacyBlock?: CstNode[];
    clusterDefinition?: CstNode[];
    connectionsBlock?: CstNode[];
    flowBlock?: CstNode[];
    nestedCell?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) {
      return { _type: 'label', value: this.visit(ctx.labelProperty[0]) };
    }
    if (ctx.typeProperty?.[0]) {
      return { _type: 'cellType', value: this.visit(ctx.typeProperty[0]) };
    }
    if (ctx.descriptionProperty?.[0]) {
      return { _type: 'description', value: this.visit(ctx.descriptionProperty[0]) };
    }
    if (ctx.replicasProperty?.[0]) {
      return { _type: 'replicas', value: this.visit(ctx.replicasProperty[0]) };
    }
    if (ctx.gatewayBlock?.[0]) {
      return { _type: 'gateway', value: this.visit(ctx.gatewayBlock[0]) };
    }
    if (ctx.componentsBlock?.[0]) {
      return { _type: 'components', value: this.visit(ctx.componentsBlock[0]) };
    }
    if (ctx.componentBlock?.[0]) {
      return { _type: 'component', value: this.visit(ctx.componentBlock[0]) };
    }
    if (ctx.databaseBlock?.[0]) {
      return { _type: 'component', value: this.visit(ctx.databaseBlock[0]) };
    }
    if (ctx.functionBlock?.[0]) {
      return { _type: 'component', value: this.visit(ctx.functionBlock[0]) };
    }
    if (ctx.legacyBlock?.[0]) {
      return { _type: 'component', value: this.visit(ctx.legacyBlock[0]) };
    }
    if (ctx.clusterDefinition?.[0]) {
      return { _type: 'cluster', value: this.visit(ctx.clusterDefinition[0]) };
    }
    if (ctx.connectionsBlock?.[0]) {
      const connectionsBlock = this.visit(ctx.connectionsBlock[0]) as ConnectionsBlock;
      const internalConns: InternalConnection[] = connectionsBlock.connections.map(conn => ({
        type: 'InternalConnection' as const,
        source: conn.source.entity,
        target: conn.target.entity,
      }));
      return { _type: 'connections', value: internalConns };
    }
    if (ctx.flowBlock?.[0]) {
      return { _type: 'flow', value: this.visit(ctx.flowBlock[0]) };
    }
    if (ctx.nestedCell?.[0]) {
      return { _type: 'nestedCell', value: this.visit(ctx.nestedCell[0]) };
    }
    return null;
  }

  labelProperty(ctx: { labelValue: IToken[] }): string {
    return extractStringValue(ctx.labelValue[0]!);
  }

  typeProperty(ctx: { cellTypeValue: CstNode[] }): CellType {
    return this.visit(ctx.cellTypeValue[0]!) as CellType;
  }

  descriptionProperty(ctx: { descValue: IToken[] }): string {
    return extractStringValue(ctx.descValue[0]!);
  }

  replicasProperty(ctx: { replicaCount: IToken[] }): number {
    return parseInt(ctx.replicaCount[0]!.image, 10);
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
    gatewayDirection?: IToken[];
    gatewayId?: IToken[];
    gatewayProperty?: CstNode[];
  }): GatewayDefinition {
    let direction: GatewayDirection | undefined;
    if (ctx.gatewayDirection?.[0]) {
      direction = ctx.gatewayDirection[0].tokenType.name === 'Ingress' ? 'ingress' : 'egress';
    }

    const id = ctx.gatewayId?.[0] ? extractStringValue(ctx.gatewayId[0]) : 'gateway';
    let label: string | undefined;
    let protocol: string | undefined;
    let port: number | undefined;
    let context: string | undefined;
    let target: string | undefined;
    let policy: string | undefined;
    let exposes: EndpointType[] = [];
    let policies: string[] = [];
    let auth: AuthConfig | undefined;
    const routes: RouteDefinition[] = [];

    if (ctx.gatewayProperty) {
      for (const propNode of ctx.gatewayProperty) {
        const result = this.visit(propNode) as { _type: string; value: unknown } | null;

        if (result) {
          switch (result._type) {
            case 'label':
              label = result.value as string;
              break;
            case 'protocol':
              protocol = result.value as string;
              break;
            case 'port':
              port = result.value as number;
              break;
            case 'context':
              context = result.value as string;
              break;
            case 'target':
              target = result.value as string;
              break;
            case 'policy':
              policy = result.value as string;
              break;
            case 'exposes':
              exposes = result.value as EndpointType[];
              break;
            case 'policies':
              policies = result.value as string[];
              break;
            case 'auth':
              auth = result.value as AuthConfig;
              break;
            case 'route':
              routes.push(result.value as RouteDefinition);
              break;
          }
        }
      }
    }

    return {
      type: 'GatewayDefinition',
      id,
      ...(direction && { direction }),
      ...(label && { label }),
      ...(protocol && { protocol }),
      ...(port !== undefined && { port }),
      ...(context && { context }),
      ...(target && { target }),
      ...(policy && { policy }),
      exposes,
      policies,
      ...(auth && { auth }),
      routes,
    };
  }

  gatewayProperty(ctx: {
    labelProperty?: CstNode[];
    protocolProperty?: CstNode[];
    portProperty?: CstNode[];
    contextProperty?: CstNode[];
    targetProperty?: CstNode[];
    policyProperty?: CstNode[];
    exposesProperty?: CstNode[];
    policiesProperty?: CstNode[];
    authProperty?: CstNode[];
    routeStatement?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) return { _type: 'label', value: this.visit(ctx.labelProperty[0]) };
    if (ctx.protocolProperty?.[0]) return { _type: 'protocol', value: this.visit(ctx.protocolProperty[0]) };
    if (ctx.portProperty?.[0]) return { _type: 'port', value: this.visit(ctx.portProperty[0]) };
    if (ctx.contextProperty?.[0]) return { _type: 'context', value: this.visit(ctx.contextProperty[0]) };
    if (ctx.targetProperty?.[0]) return { _type: 'target', value: this.visit(ctx.targetProperty[0]) };
    if (ctx.policyProperty?.[0]) return { _type: 'policy', value: this.visit(ctx.policyProperty[0]) };
    if (ctx.exposesProperty?.[0]) return { _type: 'exposes', value: this.visit(ctx.exposesProperty[0]) };
    if (ctx.policiesProperty?.[0]) return { _type: 'policies', value: this.visit(ctx.policiesProperty[0]) };
    if (ctx.authProperty?.[0]) return { _type: 'auth', value: this.visit(ctx.authProperty[0]) };
    if (ctx.routeStatement?.[0]) return { _type: 'route', value: this.visit(ctx.routeStatement[0]) };
    return null;
  }

  protocolProperty(ctx: { protocolValue: IToken[] }): string {
    const token = ctx.protocolValue[0]!;
    if (token.tokenType.name === 'StringLiteral') {
      return extractStringValue(token);
    }
    return token.image.toLowerCase();
  }

  portProperty(ctx: { portValue: IToken[] }): number {
    return parseInt(ctx.portValue[0]!.image, 10);
  }

  contextProperty(ctx: { contextValue: IToken[] }): string {
    return extractStringValue(ctx.contextValue[0]!);
  }

  targetProperty(ctx: { targetValue: IToken[] }): string {
    return extractStringValue(ctx.targetValue[0]!);
  }

  policyProperty(ctx: { policyValue: IToken[] }): string {
    return extractStringValue(ctx.policyValue[0]!);
  }

  routeStatement(ctx: {
    routePath: IToken[];
    routeTarget: CstNode[];
  }): RouteDefinition {
    return {
      type: 'RouteDefinition',
      path: extractStringValue(ctx.routePath[0]!),
      target: this.visit(ctx.routeTarget[0]!) as string,
    };
  }

  exposesProperty(ctx: { endpointType: CstNode[] }): EndpointType[] {
    return ctx.endpointType.map(node => this.visit(node) as EndpointType);
  }

  policiesProperty(ctx: { policyValue: CstNode[] }): string[] {
    return ctx.policyValue.map(node => this.visit(node) as string);
  }

  policyValue(ctx: { policy: IToken[] }): string {
    return extractStringValue(ctx.policy[0]!);
  }

  authProperty(ctx: {
    authType: IToken[];
    authReference?: CstNode[];
  }): AuthConfig {
    const token = ctx.authType[0]!;
    const authType: AuthType = token.tokenType.name === 'LocalSts' ? 'local-sts' : 'federated';

    let reference: string | undefined;
    if (ctx.authReference?.[0]) {
      reference = this.visit(ctx.authReference[0]) as string;
    }

    return {
      type: 'AuthConfig',
      authType,
      ...(reference && { reference }),
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
  // Component Definitions
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
    const id = extractStringValue(ctx.componentId[0]!);
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
      env: [],
      attributes,
      ...(sidecars && { sidecars }),
    };
  }

  componentBlock(ctx: {
    componentId: IToken[];
    componentProperty?: CstNode[];
  }): ComponentDefinition {
    const id = extractStringValue(ctx.componentId[0]!);
    let source: string | undefined;
    let port: number | undefined;
    const env: EnvVar[] = [];
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.componentProperty) {
      for (const propNode of ctx.componentProperty) {
        const result = this.visit(propNode) as { _type: string; value: unknown } | null;
        if (result) {
          switch (result._type) {
            case 'source':
              source = result.value as string;
              break;
            case 'port':
              port = result.value as number;
              break;
            case 'env':
              env.push(...(result.value as EnvVar[]));
              break;
            case 'property':
              const prop = result.value as [string, AttributeValue];
              attributes[prop[0]] = prop[1];
              break;
          }
        }
      }
    }

    return {
      type: 'ComponentDefinition',
      id,
      componentType: 'microservice',
      ...(source && { source }),
      ...(port !== undefined && { port }),
      env,
      attributes,
    };
  }

  databaseBlock(ctx: {
    databaseId: IToken[];
    databaseProperty?: CstNode[];
  }): ComponentDefinition {
    const id = extractStringValue(ctx.databaseId[0]!);
    let engine: string | undefined;
    let storage: string | undefined;
    let version: string | undefined;
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.databaseProperty) {
      for (const propNode of ctx.databaseProperty) {
        const result = this.visit(propNode) as { _type: string; value: unknown } | null;
        if (result) {
          switch (result._type) {
            case 'engine':
              engine = result.value as string;
              break;
            case 'storage':
              storage = result.value as string;
              break;
            case 'version':
              version = result.value as string;
              break;
            case 'property':
              const prop = result.value as [string, AttributeValue];
              attributes[prop[0]] = prop[1];
              break;
          }
        }
      }
    }

    return {
      type: 'ComponentDefinition',
      id,
      componentType: 'database',
      ...(engine && { engine }),
      ...(storage && { storage }),
      ...(version && { version }),
      env: [],
      attributes,
    };
  }

  functionBlock(ctx: {
    functionId: IToken[];
    componentProperty?: CstNode[];
  }): ComponentDefinition {
    const id = extractStringValue(ctx.functionId[0]!);
    let source: string | undefined;
    let port: number | undefined;
    const env: EnvVar[] = [];
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.componentProperty) {
      for (const propNode of ctx.componentProperty) {
        const result = this.visit(propNode) as { _type: string; value: unknown } | null;
        if (result) {
          switch (result._type) {
            case 'source':
              source = result.value as string;
              break;
            case 'port':
              port = result.value as number;
              break;
            case 'env':
              env.push(...(result.value as EnvVar[]));
              break;
            case 'property':
              const prop = result.value as [string, AttributeValue];
              attributes[prop[0]] = prop[1];
              break;
          }
        }
      }
    }

    return {
      type: 'ComponentDefinition',
      id,
      componentType: 'function',
      ...(source && { source }),
      ...(port !== undefined && { port }),
      env,
      attributes,
    };
  }

  legacyBlock(ctx: {
    legacyId: IToken[];
    componentProperty?: CstNode[];
  }): ComponentDefinition {
    const id = extractStringValue(ctx.legacyId[0]!);
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.componentProperty) {
      for (const propNode of ctx.componentProperty) {
        const result = this.visit(propNode) as { _type: string; value: unknown } | null;
        if (result && result._type === 'property') {
          const prop = result.value as [string, AttributeValue];
          attributes[prop[0]] = prop[1];
        }
      }
    }

    return {
      type: 'ComponentDefinition',
      id,
      componentType: 'legacy',
      env: [],
      attributes,
    };
  }

  componentProperty(ctx: {
    sourceProperty?: CstNode[];
    portProperty?: CstNode[];
    envBlock?: CstNode[];
    genericProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.sourceProperty?.[0]) return { _type: 'source', value: this.visit(ctx.sourceProperty[0]) };
    if (ctx.portProperty?.[0]) return { _type: 'port', value: this.visit(ctx.portProperty[0]) };
    if (ctx.envBlock?.[0]) return { _type: 'env', value: this.visit(ctx.envBlock[0]) };
    if (ctx.genericProperty?.[0]) return { _type: 'property', value: this.visit(ctx.genericProperty[0]) };
    return null;
  }

  databaseProperty(ctx: {
    engineProperty?: CstNode[];
    storageProperty?: CstNode[];
    versionPropertyDb?: CstNode[];
    genericProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.engineProperty?.[0]) return { _type: 'engine', value: this.visit(ctx.engineProperty[0]) };
    if (ctx.storageProperty?.[0]) return { _type: 'storage', value: this.visit(ctx.storageProperty[0]) };
    if (ctx.versionPropertyDb?.[0]) return { _type: 'version', value: this.visit(ctx.versionPropertyDb[0]) };
    if (ctx.genericProperty?.[0]) return { _type: 'property', value: this.visit(ctx.genericProperty[0]) };
    return null;
  }

  sourceProperty(ctx: { sourceValue: IToken[] }): string {
    return extractStringValue(ctx.sourceValue[0]!);
  }

  engineProperty(ctx: { engineValue: IToken[] }): string {
    return extractStringValue(ctx.engineValue[0]!);
  }

  storageProperty(ctx: { storageValue: IToken[] }): string {
    return extractStringValue(ctx.storageValue[0]!);
  }

  versionPropertyDb(ctx: { versionValue: IToken[] }): string {
    return extractStringValue(ctx.versionValue[0]!);
  }

  envBlock(ctx: { envVar?: CstNode[] }): EnvVar[] {
    if (!ctx.envVar) return [];
    return ctx.envVar.map(node => this.visit(node) as EnvVar);
  }

  envVar(ctx: {
    envKey: IToken[];
    envValue: IToken[];
  }): EnvVar {
    return {
      type: 'EnvVar',
      key: ctx.envKey[0]!.image,
      value: extractStringValue(ctx.envValue[0]!),
    };
  }

  genericProperty(ctx: {
    propKey: IToken[];
    propValue: CstNode[];
  }): [string, AttributeValue] {
    const key = ctx.propKey[0]!.image;
    const value = this.visit(ctx.propValue[0]!) as AttributeValue;
    return [key, value];
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
        const result = this.visit(bodyNode) as { _type: string; value: unknown } | null;
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
      ...(clusterType && { clusterType }),
      ...(replicas !== undefined && { replicas }),
      components,
    };
  }

  clusterBody(ctx: {
    clusterTypeProperty?: CstNode[];
    replicasProperty?: CstNode[];
    componentDefinition?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.clusterTypeProperty?.[0]) return { _type: 'clusterType', value: this.visit(ctx.clusterTypeProperty[0]) };
    if (ctx.replicasProperty?.[0]) return { _type: 'replicas', value: this.visit(ctx.replicasProperty[0]) };
    if (ctx.componentDefinition?.[0]) return { _type: 'component', value: this.visit(ctx.componentDefinition[0]) };
    return null;
  }

  clusterTypeProperty(ctx: { componentType: CstNode[] }): string {
    return this.visit(ctx.componentType[0]!) as string;
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
      if (tokenName === 'StringLiteral') return extractStringValue(token);
      if (tokenName === 'NumberLiteral') {
        const num = token.image;
        return num.includes('.') ? parseFloat(num) : parseInt(num, 10);
      }
      if (tokenName === 'True') return true;
      if (tokenName === 'False') return false;
    }
    if (ctx.arrayValue?.[0]) return this.visit(ctx.arrayValue[0]) as string[];
    if (ctx.identifierValue?.[0]) return this.visit(ctx.identifierValue[0]) as string;
    return '';
  }

  arrayValue(ctx: { arrayElement?: CstNode[] }): string[] {
    if (!ctx.arrayElement) return [];
    return ctx.arrayElement.map(node => this.visit(node) as string);
  }

  arrayElement(ctx: { element: IToken[] }): string {
    return extractStringValue(ctx.element[0]!);
  }

  identifierValue(ctx: { idValue: IToken[] }): string {
    return ctx.idValue[0]!.image;
  }

  // ========================================
  // Flow Block
  // ========================================

  flowBlock(ctx: {
    flowName?: IToken[];
    flowStatement?: CstNode[];
  }): FlowDefinition {
    const name = ctx.flowName?.[0] ? extractStringValue(ctx.flowName[0]) : undefined;
    const flows: FlowConnection[] = [];

    if (ctx.flowStatement) {
      for (const stmtNode of ctx.flowStatement) {
        const connections = this.visit(stmtNode) as FlowConnection[];
        flows.push(...connections);
      }
    }

    return {
      type: 'FlowDefinition',
      ...(name && { name }),
      flows,
    };
  }

  flowStatement(ctx: {
    flowSource: CstNode[];
    flowTarget: CstNode[];
    flowLabel?: IToken[];
  }): FlowConnection[] {
    // Collect all references (source + all targets in the chain)
    const refs: string[] = [this.visit(ctx.flowSource[0]!) as string];

    for (const targetNode of ctx.flowTarget) {
      refs.push(this.visit(targetNode) as string);
    }

    const label = ctx.flowLabel?.[0] ? extractStringValue(ctx.flowLabel[0]) : undefined;

    // Convert chain A -> B -> C into [A->B, B->C]
    const flows: FlowConnection[] = [];
    for (let i = 0; i < refs.length - 1; i++) {
      flows.push({
        type: 'FlowConnection',
        source: refs[i]!,
        destination: refs[i + 1]!,
        ...(i === refs.length - 2 && label && { label }),
      });
    }

    return flows;
  }

  reference(ctx: {
    refEntity: IToken[];
    refComponent?: IToken[];
  }): string {
    const entity = ctx.refEntity[0]!.image;
    const component = ctx.refComponent?.[0]?.image;
    return component ? `${entity}.${component}` : entity;
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
    source: CstNode[];
    target: CstNode[];
    connectionAttributes?: CstNode[];
  }): Connection {
    const source = this.visit(ctx.source[0]!) as ConnectionEndpoint;
    const target = this.visit(ctx.target[0]!) as ConnectionEndpoint;

    let direction: ConnectionDirection | undefined;
    const attributes: Record<string, AttributeValue> = {};

    if (ctx.connectionAttributes?.[0]) {
      const result = this.visit(ctx.connectionAttributes[0]) as {
        direction?: ConnectionDirection;
        attributes: Record<string, AttributeValue>;
      };
      direction = result.direction;
      Object.assign(attributes, result.attributes);
    }

    return {
      type: 'Connection',
      ...(direction && { direction }),
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
        } else {
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
      return { _type: 'direction', value: this.visit(ctx.connectionDirection[0]) as ConnectionDirection };
    }
    if (ctx.property?.[0]) {
      const [key, value] = this.visit(ctx.property[0]) as [string, AttributeValue];
      return { _type: 'property', key, value };
    }
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
    return {
      type: 'ConnectionEndpoint',
      entity: ctx.entity[0]!.image,
      ...(ctx.component?.[0] && { component: ctx.component[0].image }),
    };
  }

  // ========================================
  // External Definition
  // ========================================

  externalDefinition(ctx: {
    externalId: IToken[];
    inlineExternalType?: CstNode[];
    externalBody?: CstNode[];
  }): ExternalDefinition {
    const externalIdValue = extractStringValue(ctx.externalId[0]!);
    const id = externalIdValue.replace(/\s+/g, '');
    let label: string | undefined = externalIdValue;
    let externalType: ExternalType = 'saas';
    let provides: EndpointType[] | undefined;

    // Handle inline type: external "Name" type:saas { }
    if (ctx.inlineExternalType?.[0]) {
      externalType = this.visit(ctx.inlineExternalType[0]) as ExternalType;
    }

    if (ctx.externalBody) {
      for (const bodyNode of ctx.externalBody) {
        const result = this.visit(bodyNode) as { _type: string; value: unknown } | null;
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
      label,
      externalType,
      ...(provides && { provides }),
    };
  }

  inlineExternalType(ctx: { externalType: IToken[] }): ExternalType {
    const token = ctx.externalType[0]!;
    const mapping: Record<string, ExternalType> = {
      'Saas': 'saas',
      'Partner': 'partner',
      'Enterprise': 'enterprise',
    };
    return mapping[token.tokenType.name] || 'saas';
  }

  externalBody(ctx: {
    labelProperty?: CstNode[];
    externalTypeProperty?: CstNode[];
    providesProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) return { _type: 'label', value: this.visit(ctx.labelProperty[0]) };
    if (ctx.externalTypeProperty?.[0]) return { _type: 'externalType', value: this.visit(ctx.externalTypeProperty[0]) };
    if (ctx.providesProperty?.[0]) return { _type: 'provides', value: this.visit(ctx.providesProperty[0]) };
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
    inlineUserType?: CstNode[];
    userBody?: CstNode[];
  }): UserDefinition {
    const userIdValue = extractStringValue(ctx.userId[0]!);
    const id = userIdValue.replace(/\s+/g, '');
    let label: string | undefined = userIdValue;
    let userType: UserType = 'external';
    let channels: string[] | undefined;

    // Handle inline type: user "Name" type:external { }
    if (ctx.inlineUserType?.[0]) {
      userType = this.visit(ctx.inlineUserType[0]) as UserType;
    }

    if (ctx.userBody) {
      for (const bodyNode of ctx.userBody) {
        const result = this.visit(bodyNode) as { _type: string; value: unknown } | null;
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
      label,
      userType,
      ...(channels && { channels }),
    };
  }

  inlineUserType(ctx: { userType: IToken[] }): UserType {
    const token = ctx.userType[0]!;
    const mapping: Record<string, UserType> = {
      'External': 'external',
      'Internal': 'internal',
      'System': 'system',
    };
    return mapping[token.tokenType.name] || 'external';
  }

  userBody(ctx: {
    labelProperty?: CstNode[];
    userTypeProperty?: CstNode[];
    channelsProperty?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) return { _type: 'label', value: this.visit(ctx.labelProperty[0]) };
    if (ctx.userTypeProperty?.[0]) return { _type: 'userType', value: this.visit(ctx.userTypeProperty[0]) };
    if (ctx.channelsProperty?.[0]) return { _type: 'channels', value: this.visit(ctx.channelsProperty[0]) };
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
    return extractStringValue(ctx.channel[0]!);
  }

  // ========================================
  // Application Definition
  // ========================================

  applicationDefinition(ctx: {
    applicationId: IToken[];
    applicationBody?: CstNode[];
  }): ApplicationDefinition {
    const id = extractStringValue(ctx.applicationId[0]!);
    let label: string | undefined;
    let version: string | undefined;
    let cells: string[] = [];
    let gateway: GatewayDefinition | undefined;

    if (ctx.applicationBody) {
      for (const bodyNode of ctx.applicationBody) {
        const result = this.visit(bodyNode) as { _type: string; value: unknown } | null;
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
      ...(label && { label }),
      ...(version && { version }),
      cells,
      ...(gateway && { gateway }),
    };
  }

  applicationBody(ctx: {
    labelProperty?: CstNode[];
    versionProperty?: CstNode[];
    cellsProperty?: CstNode[];
    gatewayBlock?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.labelProperty?.[0]) return { _type: 'label', value: this.visit(ctx.labelProperty[0]) };
    if (ctx.versionProperty?.[0]) return { _type: 'version', value: this.visit(ctx.versionProperty[0]) };
    if (ctx.cellsProperty?.[0]) return { _type: 'cells', value: this.visit(ctx.cellsProperty[0]) };
    if (ctx.gatewayBlock?.[0]) return { _type: 'gateway', value: this.visit(ctx.gatewayBlock[0]) };
    return null;
  }

  versionProperty(ctx: { versionValue: IToken[] }): string {
    return extractStringValue(ctx.versionValue[0]!);
  }

  cellsProperty(ctx: { cellRef: IToken[] }): string[] {
    return ctx.cellRef.map(token => token.image);
  }
}

// ============================================
// Singleton Visitor Instance
// ============================================

export const visitorInstance = new CellDiagramsVisitor();

/**
 * Cell Diagrams CST Visitor
 *
 * Transforms the Concrete Syntax Tree (CST) into an Abstract Syntax Tree (AST).
 */

import { CstNode, IToken } from 'chevrotain';
import { getBaseCstVisitorConstructor } from './parser';
import {
  Program,
  Statement,
  CellDefinition,
  ComponentDefinition,
  InternalConnection,
  EndpointDefinition,
  ExternalDefinition,
  UserDefinition,
  Connection,
  Attribute,
  ComponentType,
  CellType,
  EndpointType,
  COMPONENT_TYPE_MAP,
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

// ============================================
// Visitor Implementation
// ============================================

const BaseCstVisitor = getBaseCstVisitorConstructor();

class CellDiagramsVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  program(ctx: { statement?: CstNode[] }): Program {
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
      statements,
    };
  }

  statement(ctx: {
    cellDefinition?: CstNode[];
    externalDefinition?: CstNode[];
    userDefinition?: CstNode[];
    connection?: CstNode[];
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
    if (ctx.connection?.[0]) {
      return this.visit(ctx.connection[0]) as Connection;
    }
    return null;
  }

  cellDefinition(ctx: { cellId: IToken[]; cellBodyItem?: CstNode[] }): CellDefinition {
    const id = ctx.cellId[0]!.image;
    let name: string | undefined;
    let cellType: CellType | undefined;
    const components: ComponentDefinition[] = [];
    const internalConnections: InternalConnection[] = [];
    const exposedEndpoints: EndpointDefinition[] = [];

    if (ctx.cellBodyItem) {
      for (const item of ctx.cellBodyItem) {
        const result = this.visit(item) as {
          _type: string;
          value: unknown;
        } | null;
        if (result) {
          if (result._type === 'name') {
            name = result.value as string;
          } else if (result._type === 'cellType') {
            cellType = result.value as CellType;
          } else if (result._type === 'components') {
            components.push(...(result.value as ComponentDefinition[]));
          } else if (result._type === 'connections') {
            internalConnections.push(...(result.value as InternalConnection[]));
          } else if (result._type === 'endpoints') {
            exposedEndpoints.push(...(result.value as EndpointDefinition[]));
          }
        }
      }
    }

    return {
      type: 'CellDefinition',
      id,
      ...(name !== undefined && { name }),
      ...(cellType !== undefined && { cellType }),
      components,
      internalConnections,
      exposedEndpoints,
    };
  }

  cellBodyItem(ctx: {
    nameProperty?: CstNode[];
    typeProperty?: CstNode[];
    componentsBlock?: CstNode[];
    connectBlock?: CstNode[];
    exposeBlock?: CstNode[];
  }): { _type: string; value: unknown } | null {
    if (ctx.nameProperty?.[0]) {
      const value = this.visit(ctx.nameProperty[0]) as string;
      return { _type: 'name', value };
    }
    if (ctx.typeProperty?.[0]) {
      const value = this.visit(ctx.typeProperty[0]) as CellType;
      return { _type: 'cellType', value };
    }
    if (ctx.componentsBlock?.[0]) {
      const value = this.visit(ctx.componentsBlock[0]) as ComponentDefinition[];
      return { _type: 'components', value };
    }
    if (ctx.connectBlock?.[0]) {
      const value = this.visit(ctx.connectBlock[0]) as InternalConnection[];
      return { _type: 'connections', value };
    }
    if (ctx.exposeBlock?.[0]) {
      const value = this.visit(ctx.exposeBlock[0]) as EndpointDefinition[];
      return { _type: 'endpoints', value };
    }
    return null;
  }

  nameProperty(ctx: { StringLiteral: IToken[] }): string {
    const raw = ctx.StringLiteral[0]!.image;
    return unescapeString(raw.slice(1, -1));
  }

  typeProperty(ctx: { cellTypeValue: CstNode[] }): CellType {
    return this.visit(ctx.cellTypeValue[0]!) as CellType;
  }

  cellTypeValue(ctx: {
    Logic?: IToken[];
    Integration?: IToken[];
    Legacy?: IToken[];
    Data?: IToken[];
    Security?: IToken[];
    Channel?: IToken[];
    customType?: IToken[];
  }): CellType {
    if (ctx.Logic) return 'logic';
    if (ctx.Integration) return 'integration';
    if (ctx.Legacy) return 'legacy';
    if (ctx.Data) return 'data';
    if (ctx.Security) return 'security';
    if (ctx.Channel) return 'channel';
    if (ctx.customType?.[0]) return ctx.customType[0].image as CellType;
    return 'logic';
  }

  componentsBlock(ctx: { componentDefinition?: CstNode[] }): ComponentDefinition[] {
    const components: ComponentDefinition[] = [];
    if (ctx.componentDefinition) {
      for (const compNode of ctx.componentDefinition) {
        components.push(this.visit(compNode) as ComponentDefinition);
      }
    }
    return components;
  }

  componentDefinition(ctx: {
    componentType: CstNode[];
    componentId: IToken[];
    attributes?: CstNode[];
  }): ComponentDefinition {
    const componentType = this.visit(ctx.componentType[0]!) as ComponentType;
    const id = ctx.componentId[0]!.image;
    const attributes = ctx.attributes?.[0]
      ? (this.visit(ctx.attributes[0]) as Attribute[])
      : [];

    return {
      type: 'ComponentDefinition',
      id,
      componentType,
      attributes,
    };
  }

  componentType(ctx: {
    Ms?: IToken[];
    Fn?: IToken[];
    Db?: IToken[];
    Gw?: IToken[];
    Svc?: IToken[];
    Broker?: IToken[];
    Cache?: IToken[];
    Legacy?: IToken[];
    Esb?: IToken[];
    Idp?: IToken[];
  }): ComponentType {
    if (ctx.Ms) return COMPONENT_TYPE_MAP['ms'];
    if (ctx.Fn) return COMPONENT_TYPE_MAP['fn'];
    if (ctx.Db) return COMPONENT_TYPE_MAP['db'];
    if (ctx.Gw) return COMPONENT_TYPE_MAP['gw'];
    if (ctx.Svc) return COMPONENT_TYPE_MAP['svc'];
    if (ctx.Broker) return COMPONENT_TYPE_MAP['broker'];
    if (ctx.Cache) return COMPONENT_TYPE_MAP['cache'];
    if (ctx.Legacy) return COMPONENT_TYPE_MAP['legacy'];
    if (ctx.Esb) return COMPONENT_TYPE_MAP['esb'];
    if (ctx.Idp) return COMPONENT_TYPE_MAP['idp'];
    return 'service';
  }

  connectBlock(ctx: { internalConnection?: CstNode[] }): InternalConnection[] {
    const connections: InternalConnection[] = [];
    if (ctx.internalConnection) {
      for (const connNode of ctx.internalConnection) {
        connections.push(this.visit(connNode) as InternalConnection);
      }
    }
    return connections;
  }

  internalConnection(ctx: {
    source: IToken[];
    target: IToken[];
    attributes?: CstNode[];
  }): InternalConnection {
    return {
      type: 'InternalConnection',
      source: ctx.source[0]!.image,
      target: ctx.target[0]!.image,
      attributes: ctx.attributes?.[0]
        ? (this.visit(ctx.attributes[0]) as Attribute[])
        : [],
    };
  }

  exposeBlock(ctx: { endpointDefinition?: CstNode[] }): EndpointDefinition[] {
    const endpoints: EndpointDefinition[] = [];
    if (ctx.endpointDefinition) {
      for (const epNode of ctx.endpointDefinition) {
        endpoints.push(this.visit(epNode) as EndpointDefinition);
      }
    }
    return endpoints;
  }

  endpointDefinition(ctx: {
    endpointType: CstNode[];
    componentRef: IToken[];
    attributes?: CstNode[];
  }): EndpointDefinition {
    return {
      type: 'EndpointDefinition',
      endpointType: this.visit(ctx.endpointType[0]!) as EndpointType,
      componentRef: ctx.componentRef[0]!.image,
      attributes: ctx.attributes?.[0]
        ? (this.visit(ctx.attributes[0]) as Attribute[])
        : [],
    };
  }

  endpointType(ctx: {
    Api?: IToken[];
    Event?: IToken[];
    Stream?: IToken[];
  }): EndpointType {
    if (ctx.Api) return 'api';
    if (ctx.Event) return 'event';
    if (ctx.Stream) return 'stream';
    return 'api';
  }

  externalDefinition(ctx: {
    externalId: IToken[];
    nameProperty?: CstNode[];
    externalTypeProperty?: CstNode[];
  }): ExternalDefinition {
    const id = ctx.externalId[0]!.image;
    let name: string | undefined;
    let externalType: string | undefined;

    if (ctx.nameProperty?.[0]) {
      name = this.visit(ctx.nameProperty[0]) as string;
    }
    if (ctx.externalTypeProperty?.[0]) {
      externalType = this.visit(ctx.externalTypeProperty[0]) as string;
    }

    return {
      type: 'ExternalDefinition',
      id,
      ...(name !== undefined && { name }),
      ...(externalType !== undefined && { externalType }),
      attributes: [],
    };
  }

  externalTypeProperty(ctx: { typeValue: IToken[] }): string {
    const token = ctx.typeValue[0]!;
    const value = token.image;
    if (value.startsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }

  userDefinition(ctx: {
    userId: IToken[];
    attributes?: CstNode[];
  }): UserDefinition {
    return {
      type: 'UserDefinition',
      id: ctx.userId[0]!.image,
      attributes: ctx.attributes?.[0]
        ? (this.visit(ctx.attributes[0]) as Attribute[])
        : [],
    };
  }

  connection(ctx: {
    source: IToken[];
    target: IToken[];
    attributes?: CstNode[];
  }): Connection {
    return {
      type: 'Connection',
      source: ctx.source[0]!.image,
      target: ctx.target[0]!.image,
      attributes: ctx.attributes?.[0]
        ? (this.visit(ctx.attributes[0]) as Attribute[])
        : [],
    };
  }

  attributes(ctx: { attribute: CstNode[] }): Attribute[] {
    return ctx.attribute.map((attrNode) => this.visit(attrNode) as Attribute);
  }

  attribute(ctx: {
    attributeKey: CstNode[];
    value?: CstNode[];
  }): Attribute {
    const key = this.visit(ctx.attributeKey[0]!) as string;
    let value: string | number | boolean | undefined;

    if (ctx.value?.[0]) {
      value = this.visit(ctx.value[0]) as string | number | boolean;
    }

    return {
      type: 'Attribute',
      key,
      ...(value !== undefined && { value }),
    };
  }

  attributeKey(ctx: { key: IToken[] }): string {
    return ctx.key[0]!.image;
  }

  value(ctx: {
    StringLiteral?: IToken[];
    NumberLiteral?: IToken[];
    True?: IToken[];
    False?: IToken[];
    valueIdentifier?: CstNode[];
  }): string | number | boolean {
    if (ctx.StringLiteral?.[0]) {
      const raw = ctx.StringLiteral[0].image;
      return unescapeString(raw.slice(1, -1));
    }
    if (ctx.NumberLiteral?.[0]) {
      const num = ctx.NumberLiteral[0].image;
      return num.includes('.') ? parseFloat(num) : parseInt(num, 10);
    }
    if (ctx.True) {
      return true;
    }
    if (ctx.False) {
      return false;
    }
    if (ctx.valueIdentifier?.[0]) {
      return this.visit(ctx.valueIdentifier[0]) as string;
    }
    return '';
  }

  valueIdentifier(ctx: { identifierValue: IToken[] }): string {
    return ctx.identifierValue[0]!.image;
  }
}

// ============================================
// Singleton Visitor Instance
// ============================================

export const visitorInstance = new CellDiagramsVisitor();

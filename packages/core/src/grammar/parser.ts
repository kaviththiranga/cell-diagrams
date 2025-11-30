/**
 * Cell Diagrams Parser
 *
 * Parses tokenized Cell Diagrams DSL into a Concrete Syntax Tree (CST).
 * Uses Chevrotain's CstParser with error recovery enabled.
 */

import { CstParser } from 'chevrotain';
import {
  allTokens,
  Cell,
  External,
  User,
  Connect,
  Components,
  Expose,
  Name,
  Type,
  Via,
  Label,
  Identifier,
  StringLiteral,
  NumberLiteral,
  True,
  False,
  Arrow,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Colon,
  Comma,
  Ms,
  Fn,
  Db,
  Gw,
  Svc,
  Broker,
  Cache,
  Legacy,
  Esb,
  Idp,
  Api,
  Event,
  Stream,
  Logic,
  Integration,
  Data,
  Security,
  Channel,
} from './lexer';

// ============================================
// Parser Definition
// ============================================

export class CellDiagramsParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      maxLookahead: 3,
    });
    this.performSelfAnalysis();
  }

  // ========================================
  // Grammar Rules
  // ========================================

  /**
   * Program = Statement*
   */
  public program = this.RULE('program', () => {
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
  });

  /**
   * Statement = CellDefinition | ExternalDefinition | UserDefinition | Connection
   */
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.cellDefinition) },
      { ALT: () => this.SUBRULE(this.externalDefinition) },
      { ALT: () => this.SUBRULE(this.userDefinition) },
      { ALT: () => this.SUBRULE(this.connection) },
    ]);
  });

  /**
   * CellDefinition = "cell" Identifier "{" CellBodyItem* "}"
   */
  private cellDefinition = this.RULE('cellDefinition', () => {
    this.CONSUME(Cell);
    this.CONSUME(Identifier, { LABEL: 'cellId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.cellBodyItem);
    });
    this.CONSUME(RBrace);
  });

  /**
   * CellBodyItem = NameProperty | TypeProperty | ComponentsBlock | ConnectBlock | ExposeBlock
   */
  private cellBodyItem = this.RULE('cellBodyItem', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.nameProperty) },
      { ALT: () => this.SUBRULE(this.typeProperty) },
      { ALT: () => this.SUBRULE(this.componentsBlock) },
      { ALT: () => this.SUBRULE(this.connectBlock) },
      { ALT: () => this.SUBRULE(this.exposeBlock) },
    ]);
  });

  /**
   * NameProperty = "name" ":" StringLiteral
   */
  private nameProperty = this.RULE('nameProperty', () => {
    this.CONSUME(Name);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral);
  });

  /**
   * TypeProperty = "type" ":" CellType
   */
  private typeProperty = this.RULE('typeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.SUBRULE(this.cellTypeValue);
  });

  /**
   * CellType = "logic" | "integration" | "legacy" | "data" | "security" | "channel"
   */
  private cellTypeValue = this.RULE('cellTypeValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Logic) },
      { ALT: () => this.CONSUME(Integration) },
      { ALT: () => this.CONSUME(Legacy) },
      { ALT: () => this.CONSUME(Data) },
      { ALT: () => this.CONSUME(Security) },
      { ALT: () => this.CONSUME(Channel) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'customType' }) },
    ]);
  });

  /**
   * ComponentsBlock = "components" "{" ComponentDefinition* "}"
   */
  private componentsBlock = this.RULE('componentsBlock', () => {
    this.CONSUME(Components);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.componentDefinition);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ComponentDefinition = ComponentType Identifier Attributes?
   */
  private componentDefinition = this.RULE('componentDefinition', () => {
    this.SUBRULE(this.componentType);
    this.CONSUME(Identifier, { LABEL: 'componentId' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * ComponentType = "ms" | "fn" | "db" | "gw" | "svc" | "broker" | "cache" | "legacy" | "esb" | "idp"
   */
  private componentType = this.RULE('componentType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Ms) },
      { ALT: () => this.CONSUME(Fn) },
      { ALT: () => this.CONSUME(Db) },
      { ALT: () => this.CONSUME(Gw) },
      { ALT: () => this.CONSUME(Svc) },
      { ALT: () => this.CONSUME(Broker) },
      { ALT: () => this.CONSUME(Cache) },
      { ALT: () => this.CONSUME(Legacy) },
      { ALT: () => this.CONSUME(Esb) },
      { ALT: () => this.CONSUME(Idp) },
    ]);
  });

  /**
   * ConnectBlock = "connect" "{" InternalConnection* "}"
   */
  private connectBlock = this.RULE('connectBlock', () => {
    this.CONSUME(Connect);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.internalConnection);
    });
    this.CONSUME(RBrace);
  });

  /**
   * InternalConnection = Identifier "->" Identifier Attributes?
   */
  private internalConnection = this.RULE('internalConnection', () => {
    this.CONSUME1(Identifier, { LABEL: 'source' });
    this.CONSUME(Arrow);
    this.CONSUME2(Identifier, { LABEL: 'target' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * ExposeBlock = "expose" "{" EndpointDefinition* "}"
   */
  private exposeBlock = this.RULE('exposeBlock', () => {
    this.CONSUME(Expose);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.endpointDefinition);
    });
    this.CONSUME(RBrace);
  });

  /**
   * EndpointDefinition = EndpointType ":" Identifier Attributes?
   */
  private endpointDefinition = this.RULE('endpointDefinition', () => {
    this.SUBRULE(this.endpointType);
    this.CONSUME(Colon);
    this.CONSUME(Identifier, { LABEL: 'componentRef' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * EndpointType = "api" | "event" | "stream"
   */
  private endpointType = this.RULE('endpointType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Api) },
      { ALT: () => this.CONSUME(Event) },
      { ALT: () => this.CONSUME(Stream) },
    ]);
  });

  /**
   * ExternalDefinition = "external" Identifier "{" (NameProperty | TypeProperty)* "}"
   */
  private externalDefinition = this.RULE('externalDefinition', () => {
    this.CONSUME(External);
    this.CONSUME(Identifier, { LABEL: 'externalId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.nameProperty) },
        { ALT: () => this.SUBRULE(this.externalTypeProperty) },
      ]);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ExternalTypeProperty = "type" ":" (Identifier | StringLiteral)
   */
  private externalTypeProperty = this.RULE('externalTypeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'typeValue' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'typeValue' }) },
    ]);
  });

  /**
   * UserDefinition = "user" Identifier Attributes?
   */
  private userDefinition = this.RULE('userDefinition', () => {
    this.CONSUME(User);
    this.CONSUME(Identifier, { LABEL: 'userId' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * Connection = "connect" Identifier "->" Identifier Attributes?
   */
  private connection = this.RULE('connection', () => {
    this.CONSUME(Connect);
    this.CONSUME1(Identifier, { LABEL: 'source' });
    this.CONSUME(Arrow);
    this.CONSUME2(Identifier, { LABEL: 'target' });
    this.OPTION(() => {
      this.SUBRULE(this.attributes);
    });
  });

  /**
   * Attributes = "[" Attribute ("," Attribute)* "]"
   */
  private attributes = this.RULE('attributes', () => {
    this.CONSUME(LBracket);
    this.SUBRULE1(this.attribute);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.attribute);
    });
    this.CONSUME(RBracket);
  });

  /**
   * Attribute = AttributeKey (":" Value)?
   */
  private attribute = this.RULE('attribute', () => {
    this.SUBRULE(this.attributeKey);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.value);
    });
  });

  /**
   * AttributeKey = Identifier | Type | Via | Label | Channel | Name
   * Allow keywords to be used as attribute keys
   */
  private attributeKey = this.RULE('attributeKey', () => {
    this.OR([
      { ALT: () => this.CONSUME(Type, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Via, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Label, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Channel, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Name, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'key' }) },
    ]);
  });

  /**
   * Value = StringLiteral | NumberLiteral | "true" | "false" | ValueIdentifier
   */
  private value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.SUBRULE(this.valueIdentifier) },
    ]);
  });

  /**
   * ValueIdentifier = Identifier | External | Channel | Type | ...
   * Allow keywords to be used as identifier values
   */
  private valueIdentifier = this.RULE('valueIdentifier', () => {
    this.OR([
      { ALT: () => this.CONSUME(External, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Channel, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Type, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Name, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Via, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Label, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Logic, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Integration, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Data, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Security, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Legacy, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Api, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Event, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Stream, { LABEL: 'identifierValue' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'identifierValue' }) },
    ]);
  });
}

// ============================================
// Singleton Parser Instance
// ============================================

/**
 * Singleton parser instance.
 * Reuse this instance for performance.
 */
export const parserInstance = new CellDiagramsParser();

/**
 * Get the CST visitor constructor for building visitors.
 */
export function getBaseCstVisitorConstructor() {
  return parserInstance.getBaseCstVisitorConstructor();
}

/**
 * Get the CST visitor constructor with defaults.
 */
export function getBaseCstVisitorConstructorWithDefaults() {
  return parserInstance.getBaseCstVisitorConstructorWithDefaults();
}

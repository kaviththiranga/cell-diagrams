/**
 * Cell Diagrams Parser
 *
 * Parses tokenized Cell Diagrams DSL into a Concrete Syntax Tree (CST).
 * Complete rewrite for Cell-Based Architecture DSL.
 */

import { CstParser } from 'chevrotain';
import {
  allTokens,
  // Top-level keywords
  Diagram,
  Cell,
  External,
  User,
  Application,
  Connections,
  // Cell/Gateway properties
  Label,
  Type,
  Gateway,
  Components,
  Cluster,
  Exposes,
  Policies,
  Auth,
  Federated,
  LocalSts,
  // Cell types
  Logic,
  Integration,
  Data,
  Security,
  Channel,
  LegacyType,
  // Component types
  Microservice,
  Function,
  Database,
  Broker,
  Cache,
  Idp,
  Sts,
  Userstore,
  Esb,
  Adapter,
  Transformer,
  Webapp,
  Mobile,
  Iot,
  Ms,
  Fn,
  Db,
  // Connection directions
  Northbound,
  Southbound,
  Eastbound,
  Westbound,
  // Endpoint types
  Api,
  Events,
  Stream,
  // External/User properties
  Provides,
  Channels,
  // External types
  Saas,
  Partner,
  Enterprise,
  // User types
  Internal,
  System,
  // Attributes
  Tech,
  Replicas,
  Role,
  Sidecar,
  Provider,
  Protocol,
  Via,
  Version,
  Cells,
  // Literals & Operators
  StringLiteral,
  NumberLiteral,
  True,
  False,
  Identifier,
  Arrow,
  Dot,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  LParen,
  RParen,
  Colon,
  Comma,
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
  // Top-Level Grammar Rules
  // ========================================

  /**
   * Program = DiagramDefinition | Statement*
   */
  public program = this.RULE('program', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.diagramDefinition) },
      {
        ALT: () => {
          this.MANY(() => {
            this.SUBRULE(this.statement);
          });
        },
      },
    ]);
  });

  /**
   * DiagramDefinition = "diagram" (Identifier | StringLiteral) "{" Statement* "}"
   */
  private diagramDefinition = this.RULE('diagramDefinition', () => {
    this.CONSUME(Diagram);
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'diagramName' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'diagramName' }) },
    ]);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RBrace);
  });

  /**
   * Statement = CellDefinition | ExternalDefinition | UserDefinition
   *           | ApplicationDefinition | ConnectionsBlock
   */
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.cellDefinition) },
      { ALT: () => this.SUBRULE(this.externalDefinition) },
      { ALT: () => this.SUBRULE(this.userDefinition) },
      { ALT: () => this.SUBRULE(this.applicationDefinition) },
      { ALT: () => this.SUBRULE(this.connectionsBlock) },
    ]);
  });

  // ========================================
  // Cell Definition
  // ========================================

  /**
   * CellDefinition = "cell" Identifier "{" CellBody* "}"
   */
  private cellDefinition = this.RULE('cellDefinition', () => {
    this.CONSUME(Cell);
    this.CONSUME(Identifier, { LABEL: 'cellId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.cellBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * CellBody = LabelProperty | TypeProperty | GatewayBlock
   *          | ComponentsBlock | ClusterDefinition | ConnectionsBlock
   */
  private cellBody = this.RULE('cellBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.typeProperty) },
      { ALT: () => this.SUBRULE(this.gatewayBlock) },
      { ALT: () => this.SUBRULE(this.componentsBlock) },
      { ALT: () => this.SUBRULE(this.clusterDefinition) },
      { ALT: () => this.SUBRULE(this.connectionsBlock) },
    ]);
  });

  /**
   * LabelProperty = "label" ":" StringLiteral
   */
  private labelProperty = this.RULE('labelProperty', () => {
    this.CONSUME(Label);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral, { LABEL: 'labelValue' });
  });

  /**
   * TypeProperty = "type" ":" CellTypeValue
   */
  private typeProperty = this.RULE('typeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.SUBRULE(this.cellTypeValue);
  });

  /**
   * CellTypeValue = "logic" | "integration" | "data" | "security" | "channel" | "legacy"
   */
  private cellTypeValue = this.RULE('cellTypeValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Logic, { LABEL: 'cellType' }) },
      { ALT: () => this.CONSUME(Integration, { LABEL: 'cellType' }) },
      { ALT: () => this.CONSUME(Data, { LABEL: 'cellType' }) },
      { ALT: () => this.CONSUME(Security, { LABEL: 'cellType' }) },
      { ALT: () => this.CONSUME(Channel, { LABEL: 'cellType' }) },
      { ALT: () => this.CONSUME(LegacyType, { LABEL: 'cellType' }) },
    ]);
  });

  // ========================================
  // Gateway Definition
  // ========================================

  /**
   * GatewayBlock = "gateway" Identifier? "{" GatewayProperty* "}"
   * The identifier is optional - anonymous gateways are common in cells
   */
  private gatewayBlock = this.RULE('gatewayBlock', () => {
    this.CONSUME(Gateway);
    this.OPTION1(() => {
      this.CONSUME(Identifier, { LABEL: 'gatewayId' });
    });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.gatewayProperty);
    });
    this.CONSUME(RBrace);
  });

  /**
   * GatewayProperty = LabelProperty | ExposesProperty | PoliciesProperty | AuthProperty
   */
  private gatewayProperty = this.RULE('gatewayProperty', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.exposesProperty) },
      { ALT: () => this.SUBRULE(this.policiesProperty) },
      { ALT: () => this.SUBRULE(this.authProperty) },
    ]);
  });

  /**
   * ExposesProperty = "exposes" ":" "[" EndpointType ("," EndpointType)* "]"
   */
  private exposesProperty = this.RULE('exposesProperty', () => {
    this.CONSUME(Exposes);
    this.CONSUME(Colon);
    this.CONSUME(LBracket);
    this.SUBRULE1(this.endpointType);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.endpointType);
    });
    this.CONSUME(RBracket);
  });

  /**
   * PoliciesProperty = "policies" ":" "[" PolicyValue ("," PolicyValue)* "]"
   */
  private policiesProperty = this.RULE('policiesProperty', () => {
    this.CONSUME(Policies);
    this.CONSUME(Colon);
    this.CONSUME(LBracket);
    this.SUBRULE1(this.policyValue);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.policyValue);
    });
    this.CONSUME(RBracket);
  });

  /**
   * PolicyValue = Identifier | StringLiteral
   */
  private policyValue = this.RULE('policyValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'policy' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'policy' }) },
    ]);
  });

  /**
   * AuthProperty = "auth" ":" AuthValue
   * AuthValue = "local-sts" | "federated" ("(" Reference ")")?
   * The reference is optional for federated auth
   */
  private authProperty = this.RULE('authProperty', () => {
    this.CONSUME(Auth);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(LocalSts, { LABEL: 'authType' }) },
      {
        ALT: () => {
          this.CONSUME(Federated, { LABEL: 'authType' });
          // Reference is optional - federated can be used without specifying the STS
          this.OPTION(() => {
            this.CONSUME(LParen);
            this.SUBRULE(this.entityReference);
            this.CONSUME(RParen);
          });
        },
      },
    ]);
  });

  /**
   * EndpointType = "api" | "events" | "stream"
   */
  private endpointType = this.RULE('endpointType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Api, { LABEL: 'endpoint' }) },
      { ALT: () => this.CONSUME(Events, { LABEL: 'endpoint' }) },
      { ALT: () => this.CONSUME(Stream, { LABEL: 'endpoint' }) },
    ]);
  });

  // ========================================
  // Components Block
  // ========================================

  /**
   * ComponentsBlock = "components" "{" (ComponentDef | ClusterDef)* "}"
   */
  private componentsBlock = this.RULE('componentsBlock', () => {
    this.CONSUME(Components);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.clusterDefinition) },
        { ALT: () => this.SUBRULE(this.componentDefinition) },
      ]);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ComponentDefinition = ComponentType Identifier AttributeBlock?
   */
  private componentDefinition = this.RULE('componentDefinition', () => {
    this.SUBRULE(this.componentType);
    this.CONSUME(Identifier, { LABEL: 'componentId' });
    this.OPTION(() => {
      this.SUBRULE(this.attributeBlock);
    });
  });

  /**
   * ComponentType = "microservice" | "function" | "database" | "broker" | "cache"
   *               | "gateway" | "idp" | "sts" | "userstore" | "esb" | "adapter"
   *               | "transformer" | "webapp" | "mobile" | "iot" | "legacy"
   *               | "ms" | "fn" | "db" (aliases)
   */
  private componentType = this.RULE('componentType', () => {
    this.OR([
      { ALT: () => this.CONSUME(Microservice, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Function, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Database, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Broker, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Cache, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Gateway, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Idp, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Sts, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Userstore, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Esb, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Adapter, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Transformer, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Webapp, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Mobile, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Iot, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(LegacyType, { LABEL: 'compType' }) },
      // Aliases
      { ALT: () => this.CONSUME(Ms, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Fn, { LABEL: 'compType' }) },
      { ALT: () => this.CONSUME(Db, { LABEL: 'compType' }) },
    ]);
  });

  /**
   * ClusterDefinition = "cluster" Identifier "{" ClusterBody* "}"
   */
  private clusterDefinition = this.RULE('clusterDefinition', () => {
    this.CONSUME(Cluster);
    this.CONSUME(Identifier, { LABEL: 'clusterId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.clusterBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ClusterBody = TypeProperty | ReplicasProperty | ComponentDefinition
   */
  private clusterBody = this.RULE('clusterBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.clusterTypeProperty) },
      { ALT: () => this.SUBRULE(this.replicasProperty) },
      { ALT: () => this.SUBRULE(this.componentDefinition) },
    ]);
  });

  /**
   * ClusterTypeProperty = "type" ":" ComponentType
   */
  private clusterTypeProperty = this.RULE('clusterTypeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.SUBRULE(this.componentType);
  });

  /**
   * ReplicasProperty = "replicas" ":" NumberLiteral
   */
  private replicasProperty = this.RULE('replicasProperty', () => {
    this.CONSUME(Replicas);
    this.CONSUME(Colon);
    this.CONSUME(NumberLiteral, { LABEL: 'replicaCount' });
  });

  /**
   * AttributeBlock = "[" Property ("," Property)* "]"
   * Attributes are enclosed in square brackets with comma-separated properties
   */
  private attributeBlock = this.RULE('attributeBlock', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE1(this.property);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.property);
      });
    });
    this.CONSUME(RBracket);
  });

  /**
   * Property = PropertyKey ":" Value
   */
  private property = this.RULE('property', () => {
    this.SUBRULE(this.propertyKey);
    this.CONSUME(Colon);
    this.SUBRULE(this.propertyValue);
  });

  /**
   * PropertyKey = Identifier | Tech | Replicas | Role | Sidecar | Provider | Protocol | Via | Version
   */
  private propertyKey = this.RULE('propertyKey', () => {
    this.OR([
      { ALT: () => this.CONSUME(Tech, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Replicas, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Role, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Sidecar, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Provider, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Protocol, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Via, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Version, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Label, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Type, { LABEL: 'key' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'key' }) },
    ]);
  });

  /**
   * PropertyValue = StringLiteral | NumberLiteral | Boolean | Array | Identifier
   */
  private propertyValue = this.RULE('propertyValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'value' }) },
      { ALT: () => this.CONSUME(NumberLiteral, { LABEL: 'value' }) },
      { ALT: () => this.CONSUME(True, { LABEL: 'value' }) },
      { ALT: () => this.CONSUME(False, { LABEL: 'value' }) },
      { ALT: () => this.SUBRULE(this.arrayValue) },
      { ALT: () => this.SUBRULE(this.identifierValue) },
    ]);
  });

  /**
   * ArrayValue = "[" (ArrayElement ("," ArrayElement)*)? "]"
   */
  private arrayValue = this.RULE('arrayValue', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE1(this.arrayElement);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.arrayElement);
      });
    });
    this.CONSUME(RBracket);
  });

  /**
   * ArrayElement = StringLiteral | Identifier | Keywords that can be used as values
   */
  private arrayElement = this.RULE('arrayElement', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'element' }) },
      // Keywords that can appear as array values
      { ALT: () => this.CONSUME(Webapp, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Mobile, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Iot, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Api, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Events, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Stream, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(External, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Internal, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(System, { LABEL: 'element' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'element' }) },
    ]);
  });

  /**
   * IdentifierValue = Identifier or any keyword that can be used as a value
   */
  private identifierValue = this.RULE('identifierValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'idValue' }) },
      // Allow keywords as values
      { ALT: () => this.CONSUME(Logic, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Integration, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Data, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Security, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Channel, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(LegacyType, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Api, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Events, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Stream, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(External, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Internal, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(System, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Saas, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Partner, { LABEL: 'idValue' }) },
      { ALT: () => this.CONSUME(Enterprise, { LABEL: 'idValue' }) },
    ]);
  });

  // ========================================
  // Connections Block
  // ========================================

  /**
   * ConnectionsBlock = "connections" "{" Connection* "}"
   */
  private connectionsBlock = this.RULE('connectionsBlock', () => {
    this.CONSUME(Connections);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.connection);
    });
    this.CONSUME(RBrace);
  });

  /**
   * Connection = Source "->" Target ConnectionAttributes?
   * Connection attributes can include direction flags and key-value pairs
   */
  private connection = this.RULE('connection', () => {
    this.SUBRULE1(this.connectionEndpoint, { LABEL: 'source' });
    this.CONSUME(Arrow);
    this.SUBRULE2(this.connectionEndpoint, { LABEL: 'target' });
    this.OPTION(() => {
      this.SUBRULE(this.connectionAttributes);
    });
  });

  /**
   * ConnectionAttributes = "[" ConnectionAttr ("," ConnectionAttr)* "]"
   * Allows both direction flags and key-value pairs
   */
  private connectionAttributes = this.RULE('connectionAttributes', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE1(this.connectionAttr);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.connectionAttr);
      });
    });
    this.CONSUME(RBracket);
  });

  /**
   * ConnectionAttr = Direction | Property
   * Either a direction flag or a key-value property
   */
  private connectionAttr = this.RULE('connectionAttr', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.connectionDirection) },
      { ALT: () => this.SUBRULE(this.property) },
    ]);
  });

  /**
   * ConnectionDirection = "northbound" | "southbound" | "eastbound" | "westbound"
   */
  private connectionDirection = this.RULE('connectionDirection', () => {
    this.OR([
      { ALT: () => this.CONSUME(Northbound, { LABEL: 'direction' }) },
      { ALT: () => this.CONSUME(Southbound, { LABEL: 'direction' }) },
      { ALT: () => this.CONSUME(Eastbound, { LABEL: 'direction' }) },
      { ALT: () => this.CONSUME(Westbound, { LABEL: 'direction' }) },
    ]);
  });

  /**
   * ConnectionEndpoint = Identifier ("." Identifier)?
   */
  private connectionEndpoint = this.RULE('connectionEndpoint', () => {
    this.CONSUME1(Identifier, { LABEL: 'entity' });
    this.OPTION(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier, { LABEL: 'component' });
    });
  });

  /**
   * EntityReference = Identifier ("." Identifier)?
   * Used for auth federation reference
   */
  private entityReference = this.RULE('entityReference', () => {
    this.CONSUME1(Identifier, { LABEL: 'entity' });
    this.OPTION(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier, { LABEL: 'component' });
    });
  });

  // ========================================
  // External Definition
  // ========================================

  /**
   * ExternalDefinition = "external" Identifier "{" ExternalBody* "}"
   */
  private externalDefinition = this.RULE('externalDefinition', () => {
    this.CONSUME(External);
    this.CONSUME(Identifier, { LABEL: 'externalId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.externalBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ExternalBody = LabelProperty | ExternalTypeProperty | ProvidesProperty
   */
  private externalBody = this.RULE('externalBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.externalTypeProperty) },
      { ALT: () => this.SUBRULE(this.providesProperty) },
    ]);
  });

  /**
   * ExternalTypeProperty = "type" ":" ExternalType
   * ExternalType = "saas" | "partner" | "enterprise"
   */
  private externalTypeProperty = this.RULE('externalTypeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(Saas, { LABEL: 'externalType' }) },
      { ALT: () => this.CONSUME(Partner, { LABEL: 'externalType' }) },
      { ALT: () => this.CONSUME(Enterprise, { LABEL: 'externalType' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'externalType' }) },
    ]);
  });

  /**
   * ProvidesProperty = "provides" ":" "[" EndpointType ("," EndpointType)* "]"
   */
  private providesProperty = this.RULE('providesProperty', () => {
    this.CONSUME(Provides);
    this.CONSUME(Colon);
    this.CONSUME(LBracket);
    this.SUBRULE1(this.endpointType);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.endpointType);
    });
    this.CONSUME(RBracket);
  });

  // ========================================
  // User Definition
  // ========================================

  /**
   * UserDefinition = "user" Identifier "{" UserBody* "}"
   */
  private userDefinition = this.RULE('userDefinition', () => {
    this.CONSUME(User);
    this.CONSUME(Identifier, { LABEL: 'userId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.userBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * UserBody = LabelProperty | UserTypeProperty | ChannelsProperty
   */
  private userBody = this.RULE('userBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.userTypeProperty) },
      { ALT: () => this.SUBRULE(this.channelsProperty) },
    ]);
  });

  /**
   * UserTypeProperty = "type" ":" UserType
   * UserType = "external" | "internal" | "system"
   */
  private userTypeProperty = this.RULE('userTypeProperty', () => {
    this.CONSUME(Type);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(External, { LABEL: 'userType' }) },
      { ALT: () => this.CONSUME(Internal, { LABEL: 'userType' }) },
      { ALT: () => this.CONSUME(System, { LABEL: 'userType' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'userType' }) },
    ]);
  });

  /**
   * ChannelsProperty = "channels" ":" "[" ChannelValue ("," ChannelValue)* "]"
   */
  private channelsProperty = this.RULE('channelsProperty', () => {
    this.CONSUME(Channels);
    this.CONSUME(Colon);
    this.CONSUME(LBracket);
    this.SUBRULE1(this.channelValue);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.channelValue);
    });
    this.CONSUME(RBracket);
  });

  /**
   * ChannelValue = Identifier | StringLiteral | "web" | "mobile" | "iot"
   * Channel values can be identifiers, strings, or channel keywords
   */
  private channelValue = this.RULE('channelValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Webapp, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Mobile, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Iot, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'channel' }) },
    ]);
  });

  // ========================================
  // Application Definition
  // ========================================

  /**
   * ApplicationDefinition = "application" Identifier "{" ApplicationBody* "}"
   */
  private applicationDefinition = this.RULE('applicationDefinition', () => {
    this.CONSUME(Application);
    this.CONSUME(Identifier, { LABEL: 'applicationId' });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.applicationBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * ApplicationBody = LabelProperty | VersionProperty | CellsProperty | GatewayBlock
   */
  private applicationBody = this.RULE('applicationBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.versionProperty) },
      { ALT: () => this.SUBRULE(this.cellsProperty) },
      { ALT: () => this.SUBRULE(this.gatewayBlock) },
    ]);
  });

  /**
   * VersionProperty = "version" ":" StringLiteral
   */
  private versionProperty = this.RULE('versionProperty', () => {
    this.CONSUME(Version);
    this.CONSUME(Colon);
    this.CONSUME(StringLiteral, { LABEL: 'versionValue' });
  });

  /**
   * CellsProperty = "cells" ":" "[" Identifier ("," Identifier)* "]"
   */
  private cellsProperty = this.RULE('cellsProperty', () => {
    this.CONSUME(Cells);
    this.CONSUME(Colon);
    this.CONSUME(LBracket);
    this.CONSUME1(Identifier, { LABEL: 'cellRef' });
    this.MANY(() => {
      this.CONSUME(Comma);
      this.CONSUME2(Identifier, { LABEL: 'cellRef' });
    });
    this.CONSUME(RBracket);
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

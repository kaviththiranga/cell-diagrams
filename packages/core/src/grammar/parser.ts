/**
 * CellDL Parser
 *
 * Parses tokenized CellDL (Cell Definition Language) into a Concrete Syntax Tree (CST).
 * Based on the CellDL specification for Cell-Based Architecture.
 */

import { CstParser } from 'chevrotain';
import {
  allTokens,
  // Top-level keywords
  Workspace,
  Diagram,
  Cell,
  External,
  User,
  Application,
  Flow,
  // Cell/Gateway properties
  Label,
  Type,
  Gateway,
  Ingress,
  Egress,
  Component,
  Components,
  Cluster,
  Exposes,
  Policies,
  Auth,
  Federated,
  LocalSts,
  Route,
  Context,
  Description,
  Property,
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
  // Component properties
  Source,
  Port,
  Env,
  Engine,
  Storage,
  Target,
  Policy,
  // Endpoint types
  Api,
  Events,
  Stream,
  // Protocol types
  Https,
  Http,
  Grpc,
  Tcp,
  Mtls,
  Kafka,
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
  Equals,
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
      maxLookahead: 4,
    });
    this.performSelfAnalysis();
  }

  // ========================================
  // Top-Level Grammar Rules
  // ========================================

  /**
   * Program = WorkspaceBlock | DiagramBlock | Statement*
   * Entry point supporting both workspace (new) and diagram (legacy) syntax
   */
  public program = this.RULE('program', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.workspaceBlock) },
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
   * WorkspaceBlock = "workspace" (StringLiteral | Identifier) "{" WorkspaceBody* "}"
   * New CellDL root block with version/description/property support
   */
  private workspaceBlock = this.RULE('workspaceBlock', () => {
    this.CONSUME(Workspace);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'workspaceName' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'workspaceName' }) },
    ]);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.workspaceBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * WorkspaceBody = VersionStatement | DescriptionStatement | PropertyStatement | Statement | FlowStatement
   */
  private workspaceBody = this.RULE('workspaceBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.versionStatement) },
      { ALT: () => this.SUBRULE(this.descriptionStatement) },
      { ALT: () => this.SUBRULE(this.propertyStatement) },
      { ALT: () => this.SUBRULE(this.statement) },
      // Loose flow statements (without flow { } wrapper)
      { ALT: () => this.SUBRULE(this.flowStatement, { LABEL: 'looseFlowStatement' }) },
    ]);
  });

  /**
   * VersionStatement = "version" StringLiteral
   */
  private versionStatement = this.RULE('versionStatement', () => {
    this.CONSUME(Version);
    this.CONSUME(StringLiteral, { LABEL: 'versionValue' });
  });

  /**
   * DescriptionStatement = "description" StringLiteral
   */
  private descriptionStatement = this.RULE('descriptionStatement', () => {
    this.CONSUME(Description);
    this.CONSUME(StringLiteral, { LABEL: 'descriptionValue' });
  });

  /**
   * PropertyStatement = "property" (Identifier | StringLiteral) "=" StringLiteral
   */
  private propertyStatement = this.RULE('propertyStatement', () => {
    this.CONSUME(Property);
    this.OR1([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'propertyKey' }) },
      { ALT: () => this.CONSUME1(StringLiteral, { LABEL: 'propertyKey' }) },
    ]);
    this.CONSUME(Equals);
    this.CONSUME2(StringLiteral, { LABEL: 'propertyValue' });
  });

  /**
   * DiagramDefinition = "diagram" (Identifier | StringLiteral) "{" Statement* "}"
   * Legacy syntax support
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
   *           | ApplicationDefinition | FlowBlock
   */
  private statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.cellDefinition) },
      { ALT: () => this.SUBRULE(this.externalDefinition) },
      { ALT: () => this.SUBRULE(this.userDefinition) },
      { ALT: () => this.SUBRULE(this.applicationDefinition) },
      { ALT: () => this.SUBRULE(this.flowBlock) },
    ]);
  });

  // ========================================
  // Cell Definition
  // ========================================

  /**
   * CellDefinition = "cell" (StringLiteral | Identifier) ("type:" CellType)? "{" CellBody* "}"
   * Supports both quoted and unquoted names, and inline type specification
   */
  private cellDefinition = this.RULE('cellDefinition', () => {
    this.CONSUME(Cell);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'cellId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'cellId' }) },
    ]);
    // Optional inline type: "type:logic"
    this.OPTION1(() => {
      this.CONSUME(Type);
      this.CONSUME(Colon);
      this.SUBRULE(this.cellTypeValue, { LABEL: 'inlineType' });
    });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.cellBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * CellBody = LabelProperty | TypeProperty | DescriptionProperty | ReplicasProperty
   *          | GatewayBlock | ComponentsBlock | ComponentBlock | ClusterDefinition
   *          | FlowBlock | NestedCellDefinition
   */
  private cellBody = this.RULE('cellBody', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.typeProperty) },
      { ALT: () => this.SUBRULE(this.descriptionProperty) },
      { ALT: () => this.SUBRULE(this.replicasProperty) },
      { ALT: () => this.SUBRULE(this.gatewayBlock) },
      { ALT: () => this.SUBRULE(this.componentsBlock) },
      { ALT: () => this.SUBRULE(this.componentBlock) },
      { ALT: () => this.SUBRULE(this.databaseBlock) },
      { ALT: () => this.SUBRULE(this.functionBlock) },
      { ALT: () => this.SUBRULE(this.legacyBlock) },
      { ALT: () => this.SUBRULE(this.clusterDefinition) },
      { ALT: () => this.SUBRULE(this.flowBlock) },
      // Loose flow statements (without flow { } wrapper)
      { ALT: () => this.SUBRULE(this.flowStatement, { LABEL: 'looseFlowStatement' }) },
      // Nested cells for composite architectures
      { ALT: () => this.SUBRULE(this.cellDefinition, { LABEL: 'nestedCell' }) },
    ]);
  });

  /**
   * LabelProperty = "label" ":" StringLiteral
   *              | "label" StringLiteral (without colon for CellDL syntax)
   */
  private labelProperty = this.RULE('labelProperty', () => {
    this.CONSUME(Label);
    this.OPTION(() => this.CONSUME(Colon));
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
   * DescriptionProperty = "description" StringLiteral
   */
  private descriptionProperty = this.RULE('descriptionProperty', () => {
    this.CONSUME(Description);
    this.CONSUME(StringLiteral, { LABEL: 'descValue' });
  });

  /**
   * ReplicasProperty = "replicas" NumberLiteral
   *                 | "replicas" ":" NumberLiteral
   */
  private replicasProperty = this.RULE('replicasProperty', () => {
    this.CONSUME(Replicas);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(NumberLiteral, { LABEL: 'replicaCount' });
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
  // Gateway Definition (Ingress/Egress)
  // ========================================

  /**
   * GatewayBlock = "gateway" GatewayDirection? (StringLiteral | Identifier)? "{" GatewayProperty* "}"
   * Supports both simple and ingress/egress gateway syntax
   */
  private gatewayBlock = this.RULE('gatewayBlock', () => {
    this.CONSUME(Gateway);
    // Optional direction: ingress or egress
    this.OPTION1(() => {
      this.OR1([
        { ALT: () => this.CONSUME(Ingress, { LABEL: 'gatewayDirection' }) },
        { ALT: () => this.CONSUME(Egress, { LABEL: 'gatewayDirection' }) },
      ]);
    });
    // Optional gateway name
    this.OPTION2(() => {
      this.OR2([
        { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'gatewayId' }) },
        { ALT: () => this.CONSUME(Identifier, { LABEL: 'gatewayId' }) },
      ]);
    });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.gatewayProperty);
    });
    this.CONSUME(RBrace);
  });

  /**
   * GatewayProperty = LabelProperty | ProtocolProperty | PortProperty | ContextProperty
   *                 | ExposesProperty | PoliciesProperty | AuthProperty
   *                 | TargetProperty | PolicyProperty | RouteStatement
   */
  private gatewayProperty = this.RULE('gatewayProperty', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.labelProperty) },
      { ALT: () => this.SUBRULE(this.protocolProperty) },
      { ALT: () => this.SUBRULE(this.portProperty) },
      { ALT: () => this.SUBRULE(this.contextProperty) },
      { ALT: () => this.SUBRULE(this.exposesProperty) },
      { ALT: () => this.SUBRULE(this.policiesProperty) },
      { ALT: () => this.SUBRULE(this.authProperty) },
      { ALT: () => this.SUBRULE(this.targetProperty) },
      { ALT: () => this.SUBRULE(this.policyProperty) },
      { ALT: () => this.SUBRULE(this.routeStatement) },
    ]);
  });

  /**
   * ProtocolProperty = "protocol" StringLiteral | "protocol" ProtocolKeyword
   */
  private protocolProperty = this.RULE('protocolProperty', () => {
    this.CONSUME(Protocol);
    this.OPTION(() => this.CONSUME(Colon));
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Https, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Http, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Grpc, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Tcp, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Mtls, { LABEL: 'protocolValue' }) },
      { ALT: () => this.CONSUME(Kafka, { LABEL: 'protocolValue' }) },
    ]);
  });

  /**
   * PortProperty = "port" NumberLiteral
   */
  private portProperty = this.RULE('portProperty', () => {
    this.CONSUME(Port);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(NumberLiteral, { LABEL: 'portValue' });
  });

  /**
   * ContextProperty = "context" StringLiteral
   */
  private contextProperty = this.RULE('contextProperty', () => {
    this.CONSUME(Context);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(StringLiteral, { LABEL: 'contextValue' });
  });

  /**
   * TargetProperty = "target" StringLiteral
   */
  private targetProperty = this.RULE('targetProperty', () => {
    this.CONSUME(Target);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(StringLiteral, { LABEL: 'targetValue' });
  });

  /**
   * PolicyProperty = "policy" (StringLiteral | Identifier)
   */
  private policyProperty = this.RULE('policyProperty', () => {
    this.CONSUME(Policy);
    this.OPTION(() => this.CONSUME(Colon));
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'policyValue' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'policyValue' }) },
    ]);
  });

  /**
   * RouteStatement = "route" StringLiteral "->" Reference
   */
  private routeStatement = this.RULE('routeStatement', () => {
    this.CONSUME(Route);
    this.CONSUME(StringLiteral, { LABEL: 'routePath' });
    this.CONSUME(Arrow);
    this.SUBRULE(this.reference, { LABEL: 'routeTarget' });
  });

  /**
   * ExposesProperty = "exposes" ":" "[" EndpointType ("," EndpointType)* "]"
   *                | "exposes" "[" EndpointType ("," EndpointType)* "]"
   */
  private exposesProperty = this.RULE('exposesProperty', () => {
    this.CONSUME(Exposes);
    this.OPTION1(() => this.CONSUME(Colon));
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
    this.OPTION(() => this.CONSUME(Colon));
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
   */
  private authProperty = this.RULE('authProperty', () => {
    this.CONSUME(Auth);
    this.OPTION1(() => this.CONSUME(Colon));
    this.OR([
      { ALT: () => this.CONSUME(LocalSts, { LABEL: 'authType' }) },
      {
        ALT: () => {
          this.CONSUME(Federated, { LABEL: 'authType' });
          this.OPTION2(() => {
            this.CONSUME(LParen);
            this.SUBRULE(this.reference, { LABEL: 'authReference' });
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
  // Component Definitions
  // ========================================

  /**
   * ComponentsBlock = "components" "{" (ComponentDef | ClusterDef)* "}"
   * Legacy style component list
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
   * ComponentBlock = "component" (StringLiteral | Identifier) ("{" ComponentProperty* "}")?
   * CellDL style component with optional block properties
   */
  private componentBlock = this.RULE('componentBlock', () => {
    this.CONSUME(Component);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'componentId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'componentId' }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(LBrace);
      this.MANY(() => {
        this.SUBRULE(this.componentProperty);
      });
      this.CONSUME(RBrace);
    });
  });

  /**
   * DatabaseBlock = "database" (StringLiteral | Identifier) ("{" DatabaseProperty* "}")?
   */
  private databaseBlock = this.RULE('databaseBlock', () => {
    this.CONSUME(Database);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'databaseId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'databaseId' }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(LBrace);
      this.MANY(() => {
        this.SUBRULE(this.databaseProperty);
      });
      this.CONSUME(RBrace);
    });
  });

  /**
   * FunctionBlock = "function" (StringLiteral | Identifier) ("{" ComponentProperty* "}")?
   */
  private functionBlock = this.RULE('functionBlock', () => {
    this.CONSUME(Function);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'functionId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'functionId' }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(LBrace);
      this.MANY(() => {
        this.SUBRULE(this.componentProperty);
      });
      this.CONSUME(RBrace);
    });
  });

  /**
   * LegacyBlock = "legacy" (StringLiteral | Identifier) ("{" ComponentProperty* "}")?
   */
  private legacyBlock = this.RULE('legacyBlock', () => {
    this.CONSUME(LegacyType);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'legacyId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'legacyId' }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(LBrace);
      this.MANY(() => {
        this.SUBRULE(this.componentProperty);
      });
      this.CONSUME(RBrace);
    });
  });

  /**
   * ComponentProperty = SourceProperty | PortProperty | EnvBlock | GenericProperty
   */
  private componentProperty = this.RULE('componentProperty', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.sourceProperty) },
      { ALT: () => this.SUBRULE(this.portProperty) },
      { ALT: () => this.SUBRULE(this.envBlock) },
      { ALT: () => this.SUBRULE(this.genericProperty) },
    ]);
  });

  /**
   * DatabaseProperty = EngineProperty | StorageProperty | VersionProperty | GenericProperty
   */
  private databaseProperty = this.RULE('databaseProperty', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.engineProperty) },
      { ALT: () => this.SUBRULE(this.storageProperty) },
      { ALT: () => this.SUBRULE(this.versionPropertyDb) },
      { ALT: () => this.SUBRULE(this.genericProperty) },
    ]);
  });

  /**
   * SourceProperty = "source" StringLiteral
   */
  private sourceProperty = this.RULE('sourceProperty', () => {
    this.CONSUME(Source);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(StringLiteral, { LABEL: 'sourceValue' });
  });

  /**
   * EngineProperty = "engine" (StringLiteral | Identifier | ProtocolKeyword)
   * Accepts protocol keywords like kafka as valid engine values
   */
  private engineProperty = this.RULE('engineProperty', () => {
    this.CONSUME(Engine);
    this.OPTION(() => this.CONSUME(Colon));
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'engineValue' }) },
      // Allow protocol keywords as engine values (e.g., kafka for message brokers)
      { ALT: () => this.CONSUME(Kafka, { LABEL: 'engineValue' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'engineValue' }) },
    ]);
  });

  /**
   * StorageProperty = "storage" StringLiteral
   */
  private storageProperty = this.RULE('storageProperty', () => {
    this.CONSUME(Storage);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(StringLiteral, { LABEL: 'storageValue' });
  });

  /**
   * VersionPropertyDb = "version" StringLiteral
   */
  private versionPropertyDb = this.RULE('versionPropertyDb', () => {
    this.CONSUME(Version);
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(StringLiteral, { LABEL: 'versionValue' });
  });

  /**
   * EnvBlock = "env" "{" EnvVar* "}"
   */
  private envBlock = this.RULE('envBlock', () => {
    this.CONSUME(Env);
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.envVar);
    });
    this.CONSUME(RBrace);
  });

  /**
   * EnvVar = Identifier "=" StringLiteral
   */
  private envVar = this.RULE('envVar', () => {
    this.CONSUME(Identifier, { LABEL: 'envKey' });
    this.CONSUME(Equals);
    this.CONSUME(StringLiteral, { LABEL: 'envValue' });
  });

  /**
   * GenericProperty = Identifier (":"? Value)
   */
  private genericProperty = this.RULE('genericProperty', () => {
    this.CONSUME(Identifier, { LABEL: 'propKey' });
    this.OPTION(() => this.CONSUME(Colon));
    this.SUBRULE(this.propertyValue, { LABEL: 'propValue' });
  });

  /**
   * ComponentDefinition = ComponentType (StringLiteral | Identifier) AttributeBlock?
   * Legacy inline component syntax
   */
  private componentDefinition = this.RULE('componentDefinition', () => {
    this.SUBRULE(this.componentType);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'componentId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'componentId' }) },
    ]);
    this.OPTION(() => {
      this.SUBRULE(this.attributeBlock);
    });
  });

  /**
   * ComponentType = all component type keywords
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
   * AttributeBlock = "[" Property ("," Property)* "]"
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
   * PropertyKey = Identifier | keyword that can be used as key
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
   * ArrayElement = StringLiteral | Identifier | Keywords as values
   */
  private arrayElement = this.RULE('arrayElement', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'element' }) },
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
   * IdentifierValue = Identifier or keyword as value
   */
  private identifierValue = this.RULE('identifierValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'idValue' }) },
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
  // Flow Block
  // ========================================

  /**
   * FlowBlock = "flow" (StringLiteral | Identifier)? "{" FlowStatement* "}"
   */
  private flowBlock = this.RULE('flowBlock', () => {
    this.CONSUME(Flow);
    this.OPTION1(() => {
      this.OR1([
        { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'flowName' }) },
        { ALT: () => this.CONSUME(Identifier, { LABEL: 'flowName' }) },
      ]);
    });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.flowStatement);
    });
    this.CONSUME(RBrace);
  });

  /**
   * FlowStatement = Reference ("->" Reference)+ (":" StringLiteral)?
   * Supports chained flows: A -> B -> C : "Label"
   */
  private flowStatement = this.RULE('flowStatement', () => {
    this.SUBRULE1(this.reference, { LABEL: 'flowSource' });
    this.AT_LEAST_ONE(() => {
      this.CONSUME(Arrow);
      this.SUBRULE2(this.reference, { LABEL: 'flowTarget' });
    });
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.CONSUME(StringLiteral, { LABEL: 'flowLabel' });
    });
  });

  /**
   * Reference = (Identifier | StringLiteral) ("." (Identifier | StringLiteral))?
   * Supports both simple (Component) and qualified (Cell.Component) references
   * Allows quoted identifiers for names with spaces: "Order Service" -> "Payment Service"
   */
  private reference = this.RULE('reference', () => {
    // Allow keywords like "user", identifiers, or quoted strings as first part of reference
    this.OR1([
      { ALT: () => this.CONSUME1(Identifier, { LABEL: 'refEntity' }) },
      { ALT: () => this.CONSUME(User, { LABEL: 'refEntity' }) },
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'refEntity' }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(Dot);
      this.OR2([
        { ALT: () => this.CONSUME2(Identifier, { LABEL: 'refComponent' }) },
        { ALT: () => this.CONSUME2(StringLiteral, { LABEL: 'refComponent' }) },
      ]);
    });
  });

  // ========================================
  // External Definition
  // ========================================

  /**
   * ExternalDefinition = "external" (StringLiteral | Identifier) InlineExternalType? "{" ExternalBody* "}"
   */
  private externalDefinition = this.RULE('externalDefinition', () => {
    this.CONSUME(External);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'externalId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'externalId' }) },
    ]);
    // Support inline type: external "Name" type:saas { }
    this.OPTION(() => {
      this.SUBRULE(this.inlineExternalType);
    });
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.externalBody);
    });
    this.CONSUME(RBrace);
  });

  /**
   * InlineExternalType = "type:" ExternalType
   */
  private inlineExternalType = this.RULE('inlineExternalType', () => {
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
    this.OPTION(() => this.CONSUME(Colon));
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
   * UserDefinition = "user" (StringLiteral | Identifier) InlineUserType? ("{" UserBody* "}")?
   */
  private userDefinition = this.RULE('userDefinition', () => {
    this.CONSUME(User);
    this.OR1([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'userId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'userId' }) },
    ]);
    // Support inline type: user "Name" type:external { }
    this.OPTION1(() => {
      this.SUBRULE(this.inlineUserType);
    });
    this.OPTION2(() => {
      this.CONSUME(LBrace);
      this.MANY(() => {
        this.SUBRULE(this.userBody);
      });
      this.CONSUME(RBrace);
    });
  });

  /**
   * InlineUserType = "type:" UserType
   */
  private inlineUserType = this.RULE('inlineUserType', () => {
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
    this.OPTION(() => this.CONSUME(Colon));
    this.CONSUME(LBracket);
    this.SUBRULE1(this.channelValue);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.channelValue);
    });
    this.CONSUME(RBracket);
  });

  /**
   * ChannelValue = Identifier | StringLiteral | channel keywords | endpoint keywords
   */
  private channelValue = this.RULE('channelValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(Webapp, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Mobile, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Iot, { LABEL: 'channel' }) },
      // Allow endpoint types as channel values (e.g., api, events, stream)
      { ALT: () => this.CONSUME(Api, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Events, { LABEL: 'channel' }) },
      { ALT: () => this.CONSUME(Stream, { LABEL: 'channel' }) },
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
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral, { LABEL: 'applicationId' }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: 'applicationId' }) },
    ]);
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

// Alias for CellDL naming
export const CellDLParser = CellDiagramsParser;

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

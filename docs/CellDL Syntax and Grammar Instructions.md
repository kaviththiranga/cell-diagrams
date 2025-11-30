

# **CellDL: A Definitive Specification and Implementation Guide for Cell-Based Architecture Domain-Specific Languages** (Gemini Deep Research)

## **1\. Executive Summary**

The architectural paradigm of cloud-native computing has shifted precipitously from monolithic structures to distributed microservices, and subsequently to the managed aggregation of these services known as Cell-Based Architecture (CBA). While microservices solved the problem of monolithic rigidity, they introduced "sprawl"—a chaotic proliferation of independent services that became difficult to govern, observe, and secure. CBA, as formalized by organizations like WSO2 and practiced in modern enterprise service meshes, restores order by grouping cohesive functional units into "Cells."

However, a significant gap remains in the tooling ecosystem for CBA. While Kubernetes YAML and service mesh configurations (like Istio or Linkerd) provide the mechanism for *deployment*, they lack the high-level semantic clarity required for *architectural definition*. Architects currently lack a unified language to describe the boundaries, gateways, and complex traffic flows of a cellular system in a way that is both human-readable and machine-executable.

This report introduces **CellDL** (Cell Definition Language), a declarative Domain-Specific Language (DSL) designed to bridge this gap. It provides a rigorous syntax for modeling Cells, Components, Gateways, and Traffic Flows, covering advanced scenarios such as nested cells, legacy system integration, and multi-directional traffic policies. Furthermore, this document serves as a comprehensive implementation manual for building a CellDL compiler using the **Chevrotain** parsing library. It addresses the specific challenges of LL(k) parsing, ambiguity resolution, and Abstract Syntax Tree (AST) generation, providing a "prompt-ready" blueprint suitable for accelerating development via Large Language Model (LLM) coding tools.

---

## **2\. Theoretical Foundations: The Physics of Cell-Based Architecture**

To design a DSL that accurately captures the nuances of a domain, one must first dissect the domain itself. Cell-Based Architecture is not merely a deployment strategy; it is a governance model that mimics biological organization. Just as a biological cell has a membrane (gateway), organelles (components), and specific channels for interacting with its environment, a software Cell encapsulates logic and data, exposing them only through controlled interfaces.

### **2.1 The Evolution of Architectural Atomicity**

The fundamental atomic unit of software architecture has evolved. In the monolithic era, the unit was the application. In the microservices era, it was the single service (a container). In CBA, the atomic unit is the **Cell**.1 This shift is critical because it changes the focus of the DSL from describing *processes* to describing *boundaries*.

A Cell is self-contained, deployable, and manageable. It must possess a "Control Point"—typically a Gateway—that manages all ingress and egress traffic. This implies that no component within a Cell should be directly addressable from outside the Cell, a constraint that CellDL must enforce syntactically.2

### **2.2 The Taxonomy of Cells**

A robust DSL must distinguish between the functional roles of different Cells. The research indicates at least five distinct archetypes that CellDL must support 3:

| Cell Type | Primary Function | Component Composition | Gateway Characteristics |
| :---- | :---- | :---- | :---- |
| **Logic Cell** | Business Domain Execution | Microservices, Serverless Functions | High-throughput, Protocol-aware (HTTP/gRPC) |
| **Integration Cell** | Protocol Translation & Routing | ESBs, Mediators, Adapters | Heavy transformation logic, often asynchronous |
| **Data Cell** | State Persistence | RDBMS, NoSQL, Caching Layers | Storage-optimized, strict access control lists (ACLs) |
| **Legacy Cell** | Monolith Encapsulation | "Vapor" components (proxies), Mainframes | "Vapor Gateway" (logical boundary only) |
| **Identity Cell** | Security & Governance | IDPs, Key Managers, User Stores | Highly secured, enforcing OAuth/OIDC flows |

**Architectural Insight**: The "Legacy Cell" is particularly challenging for DSLs. Unlike a Logic Cell where the components are containers we can spin up, a Legacy Cell often wraps an existing physical mainframe or a proprietary appliance. The DSL must allow describing these "unmanaged" resources without expecting standard container properties like image or replicas.6

### **2.3 The Traffic Quadrant: North, South, East, West**

In standard networking, "North-South" refers to traffic entering/leaving the data center, and "East-West" refers to traffic within it. CBA refines these definitions relative to the Cell boundary.3

* **Northbound (Ingress)**: Traffic moving *into* the Cell from a consumer (User, Mobile App, or another system). This traffic *must* hit the Cell Gateway.  
* **Southbound (Egress)**: Traffic moving *out* of the Cell to external managed dependencies (e.g., calling a SaaS API like OpenAI or Salesforce). This traffic should ideally pass through an Egress Gateway for policy enforcement.  
* **Eastbound/Westbound (Inter-Cell)**: Traffic moving between peer Cells. In a mesh architecture, this is often mutual TLS (mTLS) encrypted. The DSL must differentiate between an internal call (Component A \-\> Component B) and an inter-cell call (Cell A \-\> Cell B).

This quadrant model necessitates a DSL syntax that supports directional flows with explicit source and destination binding. A generic "connection" is insufficient; we need source \-\> destination semantics to enforce the gateway traversal rules.

### **2.4 The Gateway Ecosystem**

The Cell Gateway is the enforcement point for the Cell. Recent trends in API management differentiate between several gateway types 9:

1. **Shared Gateway**: A centralized infrastructure piece handling traffic for multiple logical Cells (common in older K8s setups).  
2. **Dedicated Micro-Gateway**: A lightweight proxy (Envoy, HAProxy) dedicated to a specific Cell.  
3. **Ingress vs. Egress**:  
   * *Ingress Gateways* handle authentication, rate limiting, and API composition.  
   * *Egress Gateways* handle token exchange, auditing, and "kill switch" functionality for outbound calls (e.g., blocking sensitive data from leaving the cell).

CellDL must provide syntactic sugar to define these gateways explicitly, allowing the user to specify whether a gateway is ingress or egress and what protocol it speaks (HTTP, TCP, gRPC, Kafka).

---

## **3\. CellDL Language Specification**

**CellDL** is designed as a text-based representation of the Cell-Based Architecture. It prioritizes readability and strict typing. It draws inspiration from HCL (HashiCorp Configuration Language) for its block structure 11 and Structurizr DSL for its concise flow definitions 12, but adds specific semantics for the WSO2 CBA model.

### **3.1 Lexical Structure and Primitives**

The language is case-sensitive (though the compiler implementation discussion will explore case-insensitivity for user-friendliness).

* **Comments**: Supports C-style single-line (//) and multi-line (/\*... \*/) comments.  
* **Identifiers**: Alphanumeric strings starting with a letter or underscore (\[a-zA-Z\_\]\[a-zA-Z0-9\_\]\*). Unquoted identifiers are preferred for names.  
* **Strings**: Double-quoted literals ("...") used for values that may contain spaces or special characters (e.g., descriptions, Docker image tags).  
* **Booleans**: true / false.  
* **Numbers**: Integers for ports and replicas.

### **3.2 The workspace Root Block**

Every CellDL file defines a system context or "workspace." This scope allows for global configuration and versioning.

Code snippet

workspace "FinTechSystem" {  
    version "1.0.0"  
    description "Core banking platform based on CBA."  
      
    // Global configurations  
    property "cloud\_provider" "aws"  
}

### **3.3 The cell Block**

The cell block is the primary container. It *must* have a unique identifier and should specify a type.

**Syntax**: cell \<Identifier\> \[type:\<Identifier\>\] {... }

Code snippet

cell "PaymentCell" type:logic {  
    description "Handles transaction processing"  
      
    // Attributes specific to the cell  
    replicas 3  
      
    // Internal definitions follow...  
}

### **3.4 Component Definitions**

Components reside within Cells. To support the "Logic vs. Legacy" distinction, CellDL supports multiple component archetypes using keywords.

* component: A standard containerized service.  
* function: A serverless function (FaaS).  
* database: A stateful data store.  
* legacy: An unmanaged external system.

Code snippet

    component "TransactionEngine" {  
        source "image:registry.corp/payment/engine:v2.4"  
        port 8080  
        env {  
            DB\_HOST \= "localhost"  
        }  
    }

    database "LedgerDB" {  
        engine "postgres"  
        storage "persistent"  
        version "14.2"  
    }

### **3.5 The Gateway Block: Explicit Ingress/Egress**

This is where CellDL diverges from generic architecture DSLs. Gateways are first-class citizens.

Code snippet

    // Ingress: The Northbound Entry  
    gateway ingress "payment-api" {  
        protocol "https"  
        port 443  
        context "/payments"  
          
        // Routes map external paths to internal components  
        route "/authorize" \-\> TransactionEngine  
        route "/history" \-\> LedgerDB  
    }

    // Egress: The Southbound Exit  
    gateway egress "visa-network" {  
        protocol "mtls"  
        target "api.visa.com"  
        policy "audit-logging"  
    }

**Insight**: Note the route keyword inside the gateway. This is syntactic sugar for a flow definition, binding the gateway explicitly to a component.

### **3.6 Traffic Flow Syntax (The Arrow Operator)**

Modeling the complex mesh of interactions requires a concise, visually intuitive syntax. CellDL uses the arrow operator \-\> to define dependencies.

**Syntax**: \<Source\> \-\> \<Destination\> \[: "Label"\]

The parser must resolve \<Source\> and \<Destination\> based on scope.

1. **Local Scope**: ComponentA \-\> ComponentB (Sibling communication).  
2. **Child Scope**: Gateway \-\> Component (Gateway routing).  
3. **Inter-Cell Scope**: CellA.Gateway \-\> CellB.Gateway (East-West traffic).

Code snippet

flow "TransactionFlow" {  
    // Northbound: External user hits the gateway  
    user \-\> PaymentCell.payment-api : "Initiates Transfer"

    // Internal: Gateway routes to logic  
    PaymentCell.payment-api \-\> PaymentCell.TransactionEngine : "Authorize"

    // Internal: Logic hits Database  
    PaymentCell.TransactionEngine \-\> PaymentCell.LedgerDB : "Persist State"

    // Southbound: Logic calls external SaaS via Egress Gateway  
    PaymentCell.TransactionEngine \-\> PaymentCell.visa-network : "Process Fiat"  
}

### **3.7 Advanced Scenario: Nested Cells and Composite Architectures**

While the V1 specification of CBA is generally flat (a mesh of peers), V2 and V3 often introduce "Composite Cells"—Cells that orchestrate other Cells. CellDL supports this via recursive block definitions.

Code snippet

cell "CompositeBanking" {  
    // A cell containing other cells  
    cell "AccountCell" {... }  
    cell "LoanCell" {... }  
      
    // Internal Orchestrator  
    component "BankingOrchestrator" {... }  
      
    flow {  
        BankingOrchestrator \-\> AccountCell.ingress  
        BankingOrchestrator \-\> LoanCell.ingress  
    }  
}

---

## **4\. Chevrotain Implementation Strategy: Computational Linguistics for DSLs**

Implementing a parser for CellDL requires a sophisticated approach. We have selected **Chevrotain** 13, a Parser Building Toolkit for JavaScript/TypeScript. Unlike parser generators (like ANTLR) which generate code from a separate grammar file (e.g., .g4), Chevrotain allows the grammar to be written directly in TypeScript. This provides superior type safety, easier debugging, and dynamic grammar capabilities.

However, implementing a DSL like CellDL in an LL(k) parser like Chevrotain presents specific challenges that must be addressed in the implementation plan.

### **4.1 The Challenge of Ambiguity: Keywords vs. Identifiers**

In CellDL, users naturally want to name their components using words that might otherwise be keywords.

* *Example*: component Component {... } or cell Cell {... }.

**The Problem**: A standard lexer tokenizes based on the first match or longest match. If Component is a reserved keyword, the lexer might consume the name "Component" as a keyword token, causing a syntax error in the parser which expects an Identifier token at that position.16

**The Solution**: Chevrotain provides a longer\_alt property for tokens. We must define keywords such that if they are part of a longer string (which would be an identifier), the identifier token is preferred. Furthermore, in the Parser, we must explicitly allow reserved words to be used as identifiers if we want to support flexible naming.

* *Implementation Detail*: We will define a GeneralIdentifier token that matches \[a-zA-Z\_\]\\w\*. All keywords (e.g., Cell, Gateway) will define longer\_alt: GeneralIdentifier. This ensures Cellular is tokenized as an Identifier, not Cell \+ ular.15

### **4.2 Handling Recursion and Nesting**

CBA structures can be deeply nested (e.g., Workspace \-\> Cell \-\> Gateway \-\> Route).  
The Problem: LL(k) parsers struggle with left-recursion (e.g., A \-\> A \+ B).  
The Solution: CellDL is designed to be hierarchical, which naturally maps to a top-down recursive descent parser. We will use Chevrotain's SUBRULE to delegate parsing of nested blocks.

* cellBlock will call SUBRULE(gatewayBlock) and SUBRULE(componentBlock).  
* This avoids left-recursion entirely by enforcing a strict hierarchy.

### **4.3 Traffic Flows and Operator Precedence**

Parsing A \-\> B \-\> C requires handling the chain.  
The Insight: In CellDL, traffic flow is linear and associative. A \-\> B \-\> C implies A calls B, and B calls C.  
Parser Strategy: We will implement a chainExpression rule.  
RULE("chainExpression", () \=\> { SUBRULE(Reference); MANY(() \=\> { CONSUME(Arrow); SUBRULE2(Reference); }) }).  
This loop consumes as many arrow-connected references as exist, building a flat list of interactions in the AST.

---

## **5\. Implementation Guide: The "Prompt-Ready" Blueprint**

This section provides the exact technical specifications and code structures required to build the CellDL compiler. These instructions are formatted to be directly consumable by an LLM-based coding assistant (like GitHub Copilot or Cursor) to generate the production-grade parser.

### **5.1 Step 1: The Lexer (Token Definitions)**

**Instruction to Tool**:

"Generate a TypeScript file lexer.ts using the chevrotain library. You must define the tokens for the CellDL language. The order of definition is critical. You must handle the 'Keywords vs Identifiers' ambiguity using the longer\_alt pattern."

**Detailed Requirements**:

1. **Categories**: Create a Keyword category to group all reserved words.  
2. **Identifier**: Define Identifier matching /\[a-zA-Z\_\]\\w\*/.  
3. **Keywords**: Define the following keywords, all with longer\_alt: Identifier:  
   * Workspace, Cell, Component, Function, Database, Legacy, Gateway, Ingress, Egress, Flow, Route, Type, Protocol, Port, Replicas, Source, Destination, True, False.  
4. **Operators & Punctuation**:  
   * LBrace ({), RBrace (}), LBracket (\`\`)  
   * Arrow (-\>), Colon (:), Dot (.), Comma (,), Equals (=).  
5. **Literals**:  
   * StringLiteral: Double-quoted, supporting escaped quotes.  
   * Integer: Digits only.  
6. **Whitespace**: Match /\\s+/ and set group: Lexer.SKIPPED.  
7. **Comments**: Match //... and /\*... \*/ and set group: Lexer.SKIPPED.

**Code Context for LLM**:

TypeScript

const Identifier \= createToken({ name: "Identifier", pattern: /\[a-zA-Z\_\]\\w\*/ });

// Helper to ensure keyword safety  
function createKeywordToken(config) {  
    return createToken({...config, longer\_alt: Identifier });  
}

const Cell \= createKeywordToken({ name: "Cell", pattern: /cell/i });  
//... repeat for all keywords

const Arrow \= createToken({ name: "Arrow", pattern: /-\>/ });

### **5.2 Step 2: The Parser (Grammar Definition)**

**Instruction to Tool**:

"Generate a TypeScript file parser.ts defining the CellDLParser class extending CstParser. Implement the grammar rules following the hierarchy: Workspace contains Cells; Cells contain Components and Gateways. Use SUBRULE, CONSUME, OPTION, and MANY."

**Grammar Rules Specification**:

1. **main**: The entry point.  
   * Rule: SUBRULE(workspaceBlock)  
2. **workspaceBlock**:  
   * Tokens: WORKSPACE, Identifier (or StringLiteral), LBrace.  
   * Body: MANY ( cellBlock OR flowBlock OR configStatement ).  
   * Close: RBrace.  
3. **cellBlock**:  
   * Tokens: CELL, Identifier.  
   * Options: OPTION ( type : Identifier ).  
   * Body: LBrace, MANY ( gatewayBlock | componentBlock | flowBlock | propertyAssignment ), RBrace.  
4. **gatewayBlock**:  
   * Tokens: GATEWAY.  
   * Type: OR ( INGRESS | EGRESS ).  
   * Name: Identifier.  
   * Body: LBrace, MANY ( routeStatement | propertyAssignment ), RBrace.  
5. **componentBlock**:  
   * Tokens: OR ( COMPONENT | DATABASE | FUNCTION | LEGACY ).  
   * Name: Identifier.  
   * Body: LBrace, MANY ( propertyAssignment ), RBrace.  
6. **flowBlock**:  
   * Tokens: FLOW, OPTION (Identifier), LBrace.  
   * Body: MANY ( flowStatement ), RBrace.  
7. **flowStatement**:  
   * Logic: A chain of references.  
   * Rule: SUBRULE(reference), AT\_LEAST\_ONE ( CONSUME(Arrow), SUBRULE2(reference) ).  
   * Label: OPTION ( CONSUME(Colon), CONSUME(StringLiteral) ).  
8. **reference**:  
   * Logic: Can be CellName.ComponentName or just ComponentName.  
   * Rule: CONSUME(Identifier), OPTION ( CONSUME(Dot), CONSUME2(Identifier) ).

**LLM Prompt Insight**: "Ensure you handle the reference rule carefully. Since Identifier is used in both reference and keywords, ensure the Parser doesn't confuse a reference starting with a keyword-like name. (Note: The Lexer longer\_alt fixes the token type, so the Parser just sees an Identifier)."

### **5.3 Step 3: The Visitor (CST to AST Transformation)**

**Instruction to Tool**:

"Generate a visitor.ts file. Extend the BaseCstVisitor. The output should be a strictly typed JSON object (Interface CellArchitecture)."

**AST Interfaces**:

TypeScript

interface CellArchitecture {  
    workspace: string;  
    cells: Cell;  
    globalFlows: Flow;  
}

interface Cell {  
    name: string;  
    type: 'logic' | 'integration' | 'legacy' | 'data';  
    gateways: Gateway;  
    components: Component;  
    internalFlows: Flow;  
}

interface Gateway {  
    direction: 'ingress' | 'egress';  
    name: string;  
    protocol?: string;  
    routes: Route;  
}

interface Flow {  
    source: string; // "CellA.ComponentB"  
    destination: string;  
    label?: string;  
}

**Visitor Logic Instructions**:

1. **workspaceBlock**: Extract the name. Initialize the arrays. Iterate over ctx.cellBlock and push results to cells.  
2. **cellBlock**: Extract the name. Check for the optional type attribute. If missing, default to logic.  
3. **flowStatement**: This is the most complex. The parser returns a list of references.  
   * *Input*: A \-\> B \-\> C  
   * *Logic*: You must decompose this into *two* flows: A-\>B and B-\>C.  
   * *Implementation*: Iterate through the references array. flows.push({ source: refs\[i\], dest: refs\[i+1\] }).

### **5.4 Step 4: Validation and Error Handling (Semantic Analysis)**

A syntactically correct file can still be architecturally invalid. The tool should generate a Validator class.

**Validation Rules to Implement**:

1. **Reference Integrity**: If a flow says A \-\> B, verify that A and B are defined components or gateways.  
2. **Encapsulation Violation**:  
   * Check: ComponentA (Cell1) \-\> ComponentB (Cell2).  
   * *Rule*: This is **ILLEGAL** in CBA. Traffic must go through a Gateway.  
   * *Error*: "Direct Westbound traffic violation. 'ComponentA' in 'Cell1' cannot address 'ComponentB' in 'Cell2' directly. Must target 'Cell2.IngressGateway'."  
3. **Gateway Types**:  
   * Check: IngressGateway \-\> ExternalURL.  
   * *Rule*: Ingress gateways usually route inward. Egress gateways route outward. Warn if an Ingress gateway targets a non-local entity.

---

## **6\. Advanced Integration: Ecosystem and Tooling**

A DSL is only as useful as the tools that consume it. The AST generated by our Chevrotain parser opens the door to powerful integrations.

### **6.1 Visualization with D2**

D2 (Declarative Diagramming) is a modern diagram scripting language.18 It is trivial to transpile CellDL AST to D2.

**Transpilation Logic**:

* **CellDL**: cell "Payment" { component "Api" }  
* **D2 Output**:  
  Code snippet  
  Payment: {  
    Api: { shape: rectangle }  
  }

* **Flows**: Payment.Api \-\> User becomes Payment.Api \-\> User.

This allows architects to type celldl code and instantly see a visual map of their Cells, complete with boundaries and traffic arrows.

### **6.2 Kubernetes Custom Resources (CRDs)**

For deployment, the AST can be fed into a templating engine (like Handlebars or simple TS string interpolation) to generate Kubernetes manifests.

* gateway ingress "api" \-\> Generates an Istio Gateway and VirtualService.  
* component "backend" \-\> Generates a K8s Deployment and Service.  
* cell "payment" \-\> Generates a K8s Namespace labeled with mesh.wso2.com/cell: payment.

### **6.3 Governance as Code**

Because CellDL is typed, we can write linting rules (using the AST) that enforce organizational policy before deployment:

* "All Egress Gateways must have an audit-log policy attached."  
* "No Legacy Cell can be deployed without a defined owner attribute."  
* "Database components cannot have public Ingress routes."

---

## **7\. Conclusion**

The transition to Cell-Based Architecture represents a maturing of the microservices landscape, moving from chaotic service sprawl to structured, governable units. **CellDL** provides the necessary linguistic framework to describe these structures with precision.

By utilizing **Chevrotain**, we gain a high-performance, fully typed parser that can handle the specific syntactical requirements of CBA—specifically the keyword ambiguities, hierarchical nesting, and directional flow logic. The implementation strategy detailed in this report provides a complete roadmap for engineering teams to build this compiler. By feeding the provided instructions into modern LLM coding tools, a prototype CellDL compiler can be bootstrapped in hours rather than days, accelerating the adoption of governable, cellular architectures in the enterprise.

The resulting toolchain—Parser, Validator, Visualizer, and K8s Generator—transforms CBA from an abstract whiteboard concept into a concrete, executable reality.

### **Citation Index**

* **Cell-Based Architecture Definition**: 3  
* **Gateway Patterns**: 9  
* **Traffic Directions (N/S/E/W)**: 7  
* **Chevrotain Lexing & Parsing**: 15  
* **Grammar/AST Logic**: 20  
* **Ecosystem (D2, Structurizr)**: 12

#### **Works cited**

1. Mastering Cell-Based Architecture for Modern Enterprises \- WSO2, accessed November 30, 2025, [https://wso2.com/library/conference/2025/07/mastering-cell-based-architecture-for-modern-enterprises/](https://wso2.com/library/conference/2025/07/mastering-cell-based-architecture-for-modern-enterprises/)  
2. Cellery: A Code-First Approach to Deploy Applications on Kubernetes \- InfoQ, accessed November 30, 2025, [https://www.infoq.com/articles/cellery-code-first-kubernetes/](https://www.infoq.com/articles/cellery-code-first-kubernetes/)  
3. reference-architecture/reference-architecture-cell-based.md at ..., accessed November 30, 2025, [https://github.com/wso2/reference-architecture/blob/master/reference-architecture-cell-based.md](https://github.com/wso2/reference-architecture/blob/master/reference-architecture-cell-based.md)  
4. How WSO2 simplifies the integration of cloud and on-premises services, accessed November 30, 2025, [https://integrity-vision.com/wso2-integration-of-cloud-and-local-services/](https://integrity-vision.com/wso2-integration-of-cloud-and-local-services/)  
5. wso2/cellery-spec \- GitHub, accessed November 30, 2025, [https://github.com/wso2/cellery-spec](https://github.com/wso2/cellery-spec)  
6. Cell-based Architecture : An Emerging Architecture Pattern for Agile Integration \- Slideshare, accessed November 30, 2025, [https://www.slideshare.net/slideshow/cellbased-architecture-an-emerging-architecture-pattern-for-agile-integration/122974945](https://www.slideshare.net/slideshow/cellbased-architecture-an-emerging-architecture-pattern-for-agile-integration/122974945)  
7. Understanding Northbound, Southbound, Eastbound, and Westbound Traffic in Networking and Distributed Systems \- DEV Community, accessed November 30, 2025, [https://dev.to/udara\_dananjaya/understanding-northbound-southbound-eastbound-and-westbound-traffic-in-networking-and-36gp](https://dev.to/udara_dananjaya/understanding-northbound-southbound-eastbound-and-westbound-traffic-in-networking-and-36gp)  
8. Really confused about the terms “east/west traffic” and “north/south” traffic. I can't make sense of it. Help. : r/sysadmin \- Reddit, accessed November 30, 2025, [https://www.reddit.com/r/sysadmin/comments/cgj5gj/really\_confused\_about\_the\_terms\_eastwest\_traffic/](https://www.reddit.com/r/sysadmin/comments/cgj5gj/really_confused_about_the_terms_eastwest_traffic/)  
9. Choosing the Right Self-Managed WSO2 API Gateway for Your Needs: Universal, Immutable, and Kubernetes Gateways, accessed November 30, 2025, [https://wso2.com/library/blogs/choosing-the-right-self-managed-wso2-api-gateway-for-your-needs/](https://wso2.com/library/blogs/choosing-the-right-self-managed-wso2-api-gateway-for-your-needs/)  
10. Unified Management of Ingress and Egress Across Multiple API Gateways \- WSO2, accessed November 30, 2025, [https://wso2.com/library/conference/2025/03/unified-management-of-ingress-egress-across-multiple-api-gateways/](https://wso2.com/library/conference/2025/03/unified-management-of-ingress-egress-across-multiple-api-gateways/)  
11. Syntax \- Configuration Language | Terraform \- HashiCorp Developer, accessed November 30, 2025, [https://developer.hashicorp.com/terraform/language/syntax/configuration](https://developer.hashicorp.com/terraform/language/syntax/configuration)  
12. Identifiers \- Structurizr, accessed November 30, 2025, [https://docs.structurizr.com/dsl/identifiers](https://docs.structurizr.com/dsl/identifiers)  
13. Introduction to Lexers, Parsers and Interpreters with Chevrotain \- DEV Community, accessed November 30, 2025, [https://dev.to/codingwithadam/introduction-to-lexers-parsers-and-interpreters-with-chevrotain-5c7b](https://dev.to/codingwithadam/introduction-to-lexers-parsers-and-interpreters-with-chevrotain-5c7b)  
14. Writing a filtering expression parser with Chevrotain parsing library \- DEV Community, accessed November 30, 2025, [https://dev.to/amplanetwork/writing-a-filtering-expression-parser-with-chevrotain-parsing-library-5cfk](https://dev.to/amplanetwork/writing-a-filtering-expression-parser-with-chevrotain-parsing-library-5cfk)  
15. Example DSL · eclipse-langium langium · Discussion \#153 \- GitHub, accessed November 30, 2025, [https://github.com/eclipse-langium/langium/discussions/153](https://github.com/eclipse-langium/langium/discussions/153)  
16. Keywords as Identifiers \- Langium, accessed November 30, 2025, [https://langium.org/docs/recipes/keywords-as-identifiers/](https://langium.org/docs/recipes/keywords-as-identifiers/)  
17. chevrotain/packages/chevrotain/test/scan/lexer\_spec.ts at master \- GitHub, accessed November 30, 2025, [https://github.com/SAP/chevrotain/blob/master/packages/chevrotain/test/scan/lexer\_spec.ts](https://github.com/SAP/chevrotain/blob/master/packages/chevrotain/test/scan/lexer_spec.ts)  
18. A complete guide to declarative diagramming with D2 \- LogRocket Blog, accessed November 30, 2025, [https://blog.logrocket.com/complete-guide-declarative-diagramming-d2/](https://blog.logrocket.com/complete-guide-declarative-diagramming-d2/)  
19. Lexer | Chevrotain, accessed November 30, 2025, [https://chevrotain.io/docs/tutorial/step1\_lexing.html](https://chevrotain.io/docs/tutorial/step1_lexing.html)  
20. Help: Basic Intro Question · Issue \#618 · Chevrotain/chevrotain \- GitHub, accessed November 30, 2025, [https://github.com/SAP/chevrotain/issues/618](https://github.com/SAP/chevrotain/issues/618)  
21. Resolving Grammar Errors \- Chevrotain, accessed November 30, 2025, [https://chevrotain.io/docs/guide/resolving\_grammar\_errors.html](https://chevrotain.io/docs/guide/resolving_grammar_errors.html)  
22. Multiple Start Rules | Chevrotain, accessed November 30, 2025, [https://chevrotain.io/docs/features/multiple\_start\_rules.html](https://chevrotain.io/docs/features/multiple_start_rules.html)
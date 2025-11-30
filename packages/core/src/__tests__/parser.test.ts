import { describe, it, expect } from 'vitest';
import { parse, parseOrThrow, validate, stringify } from '../index';

describe('CellDL Parser', () => {
  describe('parse()', () => {
    it('should parse a simple workspace', () => {
      const source = `
workspace "Test Workspace" {
  version "1.0.0"
  description "A test workspace"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
      expect(result.ast!.name).toBe('Test Workspace');
      expect(result.ast!.version).toBe('1.0.0');
      expect(result.ast!.description).toBe('A test workspace');
    });

    it('should parse a simple cell definition', () => {
      const source = `
cell "Order Management" type:logic {
  description "Handles order processing"

  gateway ingress {
    protocol https
    port 443
  }

  component "order-service" {
    source "company/order-service:latest"
    port 8080
  }

  database "order-db" {
    engine postgresql
    storage "100Gi"
  }

  flow {
    order-service -> order-db
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();
      expect(result.ast!.statements).toHaveLength(1);

      const cell = result.ast!.statements[0];
      expect(cell.type).toBe('CellDefinition');

      if (cell.type === 'CellDefinition') {
        expect(cell.label).toBe('Order Management');
        expect(cell.cellType).toBe('logic');
        expect(cell.description).toBe('Handles order processing');
        expect(cell.components).toHaveLength(2);
        expect(cell.gateways).toHaveLength(1);
        expect(cell.flows).toHaveLength(1);
      }
    });

    it('should parse gateway with routes', () => {
      const source = `
cell "API Cell" type:logic {
  gateway ingress "api-gateway" {
    protocol https
    port 443
    context "/api"

    route "/users" -> user-service
    route "/orders" -> order-service
  }

  component "user-service" {
    port 8080
  }

  component "order-service" {
    port 8081
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.gateways).toHaveLength(1);
        const gateway = cell.gateways[0];
        expect(gateway.direction).toBe('ingress');
        expect(gateway.id).toBe('api-gateway');
        expect(gateway.routes).toHaveLength(2);
        expect(gateway.routes[0].path).toBe('/users');
        expect(gateway.routes[0].target).toBe('user-service');
      }
    });

    it('should parse multiple gateways (ingress and egress)', () => {
      const source = `
cell "Service Cell" type:logic {
  gateway ingress {
    protocol https
    port 443
  }

  gateway egress "external-api" {
    protocol https
    target "https://api.example.com"
    policy retry
  }

  component "service" {
    port 8080
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.gateways).toHaveLength(2);
        expect(cell.gateways[0].direction).toBe('ingress');
        expect(cell.gateways[1].direction).toBe('egress');
        expect(cell.gateways[1].id).toBe('external-api');
        expect(cell.gateways[1].target).toBe('https://api.example.com');
        expect(cell.gateways[1].policy).toBe('retry');
      }
    });

    it('should parse component with env block', () => {
      const source = `
cell "Test" type:logic {
  component "service" {
    source "company/service:latest"
    port 8080
    env {
      DB_HOST = "localhost"
      DB_PORT = "5432"
    }
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.components).toHaveLength(1);
        const comp = cell.components[0];
        if (comp.type === 'ComponentDefinition') {
          expect(comp.source).toBe('company/service:latest');
          expect(comp.port).toBe(8080);
          expect(comp.env).toHaveLength(2);
          expect(comp.env[0].key).toBe('DB_HOST');
          expect(comp.env[0].value).toBe('localhost');
        }
      }
    });

    it('should parse database component', () => {
      const source = `
cell "Data Cell" type:data {
  database "main-db" {
    engine postgresql
    storage "500Gi"
    version "15.0"
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.components).toHaveLength(1);
        const db = cell.components[0];
        if (db.type === 'ComponentDefinition') {
          expect(db.componentType).toBe('database');
          expect(db.engine).toBe('postgresql');
          expect(db.storage).toBe('500Gi');
          expect(db.version).toBe('15.0');
        }
      }
    });

    it('should parse external definitions', () => {
      const source = `
external "Stripe Payment" type:saas {
  provides [api]
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.ast!.statements).toHaveLength(1);

      const ext = result.ast!.statements[0];
      expect(ext.type).toBe('ExternalDefinition');

      if (ext.type === 'ExternalDefinition') {
        expect(ext.label).toBe('Stripe Payment');
        expect(ext.externalType).toBe('saas');
        expect(ext.provides).toEqual(['api']);
      }
    });

    it('should parse user definitions', () => {
      const source = `
user "Customer" type:external {
  channels [web, mobile]
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const user = result.ast!.statements[0];
      expect(user.type).toBe('UserDefinition');

      if (user.type === 'UserDefinition') {
        expect(user.label).toBe('Customer');
        expect(user.userType).toBe('external');
        expect(user.channels).toEqual(['web', 'mobile']);
      }
    });

    it('should parse top-level flow definitions', () => {
      const source = `
workspace "Test" {
  cell "CellA" type:logic {
    component "service-a" {
      port 8080
    }
  }

  cell "CellB" type:logic {
    component "service-b" {
      port 8080
    }
  }

  flow "main-flow" {
    CellA -> CellB : "data sync"
    CellB -> CellA : "response"
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const flow = result.ast!.statements.find(s => s.type === 'FlowDefinition');
      expect(flow).toBeDefined();

      if (flow && flow.type === 'FlowDefinition') {
        expect(flow.name).toBe('main-flow');
        expect(flow.flows).toHaveLength(2);
        expect(flow.flows[0].source).toBe('CellA');
        expect(flow.flows[0].destination).toBe('CellB');
        expect(flow.flows[0].label).toBe('data sync');
      }
    });

    it('should parse flow chains', () => {
      const source = `
flow {
  A -> B -> C -> D : "chain"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const flow = result.ast!.statements[0];
      if (flow.type === 'FlowDefinition') {
        // Chain A -> B -> C -> D becomes [A->B, B->C, C->D]
        expect(flow.flows).toHaveLength(3);
        expect(flow.flows[0].source).toBe('A');
        expect(flow.flows[0].destination).toBe('B');
        expect(flow.flows[1].source).toBe('B');
        expect(flow.flows[1].destination).toBe('C');
        expect(flow.flows[2].source).toBe('C');
        expect(flow.flows[2].destination).toBe('D');
        expect(flow.flows[2].label).toBe('chain');
      }
    });

    it('should handle parse errors gracefully', () => {
      const source = `cell {} type:`;
      const result = parse(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBeNull();
    });

    it('should handle comments', () => {
      const source = `
// This is a cell definition
cell "Test Cell" type:logic {
  /* Multi-line
     comment */
  description "Test"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
    });

    it('should parse workspace properties', () => {
      const source = `
workspace "Test" {
  version "1.0.0"
  property author = "Team A"
  property environment = "production"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.ast!.properties).toHaveLength(2);
      expect(result.ast!.properties[0].key).toBe('author');
      expect(result.ast!.properties[0].value).toBe('Team A');
    });
  });

  describe('parseOrThrow()', () => {
    it('should return AST for valid source', () => {
      const ast = parseOrThrow('cell "Test" type:logic {}');
      expect(ast.type).toBe('Program');
    });

    it('should throw on invalid source', () => {
      expect(() => parseOrThrow('cell {}')).toThrow('Parse errors');
    });
  });

  describe('validate()', () => {
    it('should return empty array for valid source', () => {
      const errors = validate('cell "Test" type:logic {}');
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid source', () => {
      const errors = validate('cell {}');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('stringify()', () => {
    it('should roundtrip workspace through parse and stringify', () => {
      const source = `workspace "Test" {
  version "1.0.0"

  cell "Service" type:logic {
    component "api" {
      port 8080
    }
  }
}
`;
      const ast = parseOrThrow(source);
      const output = stringify(ast);
      const reparsed = parseOrThrow(output);

      expect(reparsed.name).toBe('Test');
      expect(reparsed.version).toBe('1.0.0');
      expect(reparsed.statements).toHaveLength(1);
      expect(reparsed.statements[0].type).toBe('CellDefinition');
    });

    it('should escape special characters in strings', () => {
      const source = `workspace "Test with \\"quotes\\" and\\nnewline" {}`;
      const ast = parseOrThrow(source);

      expect(ast.name).toBe('Test with "quotes" and\nnewline');
    });
  });
});

describe('All Cell Types', () => {
  const cellTypes = ['logic', 'integration', 'legacy', 'data', 'security', 'channel'];

  it.each(cellTypes)('should parse cell type %s', (cellType) => {
    const source = `cell "Test" type:${cellType} {}`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.cellType).toBe(cellType);
    }
  });
});

describe('Gateway Directions', () => {
  it('should parse ingress gateway', () => {
    const source = `
cell "Test" type:logic {
  gateway ingress {
    protocol https
  }
}
`;
    const result = parse(source);
    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.gateways[0].direction).toBe('ingress');
    }
  });

  it('should parse egress gateway', () => {
    const source = `
cell "Test" type:logic {
  gateway egress {
    protocol https
    target "https://api.example.com"
  }
}
`;
    const result = parse(source);
    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.gateways[0].direction).toBe('egress');
    }
  });
});

describe('Protocol Types', () => {
  const protocols = ['https', 'http', 'grpc', 'tcp', 'mtls', 'kafka'];

  it.each(protocols)('should parse protocol %s', (protocol) => {
    const source = `
cell "Test" type:logic {
  gateway ingress {
    protocol ${protocol}
  }
}
`;
    const result = parse(source);
    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.gateways[0].protocol).toBe(protocol);
    }
  });
});

describe('External System Types', () => {
  const externalTypes = ['saas', 'partner', 'enterprise'];

  it.each(externalTypes)('should parse external type %s', (extType) => {
    const source = `external "Test" type:${extType} {}`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const ext = result.ast!.statements[0];
    if (ext.type === 'ExternalDefinition') {
      expect(ext.externalType).toBe(extType);
    }
  });
});

describe('User Types', () => {
  const userTypes = ['external', 'internal', 'system'];

  it.each(userTypes)('should parse user type %s', (userType) => {
    const source = `user "Test" type:${userType} {}`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const user = result.ast!.statements[0];
    if (user.type === 'UserDefinition') {
      expect(user.userType).toBe(userType);
    }
  });
});

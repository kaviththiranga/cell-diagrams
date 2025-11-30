import { describe, it, expect } from 'vitest';
import { parse, parseOrThrow, validate, stringify } from '../index';

describe('Cell Diagrams Parser', () => {
  describe('parse()', () => {
    it('should parse a simple cell definition', () => {
      const source = `
cell OrderCell {
  name: "Order Management"
  type: logic

  components {
    ms OrderService
    db OrderDB
  }

  connect {
    OrderService -> OrderDB
  }

  expose {
    api: OrderService
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
        expect(cell.id).toBe('OrderCell');
        expect(cell.name).toBe('Order Management');
        expect(cell.cellType).toBe('logic');
        expect(cell.components).toHaveLength(2);
        expect(cell.internalConnections).toHaveLength(1);
        expect(cell.exposedEndpoints).toHaveLength(1);
      }
    });

    it('should parse component attributes', () => {
      const source = `
cell TestCell {
  components {
    db MainDB [tech: "PostgreSQL", replicas: 3]
    ms Service [async, readonly: true]
  }
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const cell = result.ast!.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.components[0].attributes).toHaveLength(2);
        expect(cell.components[0].attributes[0].key).toBe('tech');
        expect(cell.components[0].attributes[0].value).toBe('PostgreSQL');
        expect(cell.components[0].attributes[1].key).toBe('replicas');
        expect(cell.components[0].attributes[1].value).toBe(3);

        expect(cell.components[1].attributes).toHaveLength(2);
        expect(cell.components[1].attributes[0].key).toBe('async');
        expect(cell.components[1].attributes[0].value).toBeUndefined();
        expect(cell.components[1].attributes[1].key).toBe('readonly');
        expect(cell.components[1].attributes[1].value).toBe(true);
      }
    });

    it('should parse external definitions', () => {
      const source = `
external Stripe {
  name: "Stripe Payment Gateway"
  type: saas
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
      expect(result.ast!.statements).toHaveLength(1);

      const ext = result.ast!.statements[0];
      expect(ext.type).toBe('ExternalDefinition');

      if (ext.type === 'ExternalDefinition') {
        expect(ext.id).toBe('Stripe');
        expect(ext.name).toBe('Stripe Payment Gateway');
        expect(ext.externalType).toBe('saas');
      }
    });

    it('should parse user definitions', () => {
      const source = `user Customer [type: external, channel: web]`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const user = result.ast!.statements[0];
      expect(user.type).toBe('UserDefinition');

      if (user.type === 'UserDefinition') {
        expect(user.id).toBe('Customer');
        expect(user.attributes).toHaveLength(2);
      }
    });

    it('should parse inter-cell connections', () => {
      const source = `connect OrderCell -> CustomerCell [via: CustomerGateway, label: "Get Customer"]`;
      const result = parse(source);

      expect(result.success).toBe(true);

      const conn = result.ast!.statements[0];
      expect(conn.type).toBe('Connection');

      if (conn.type === 'Connection') {
        expect(conn.source).toBe('OrderCell');
        expect(conn.target).toBe('CustomerCell');
        expect(conn.attributes).toHaveLength(2);
      }
    });

    it('should handle parse errors gracefully', () => {
      const source = `cell {}`;
      const result = parse(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.ast).toBeNull();
    });

    it('should handle comments', () => {
      const source = `
// This is a cell definition
cell TestCell {
  /* Multi-line
     comment */
  name: "Test"
}
`;
      const result = parse(source);

      expect(result.success).toBe(true);
    });
  });

  describe('parseOrThrow()', () => {
    it('should return AST for valid source', () => {
      const ast = parseOrThrow('cell TestCell {}');
      expect(ast.type).toBe('Program');
    });

    it('should throw on invalid source', () => {
      expect(() => parseOrThrow('cell {}')).toThrow('Parse errors');
    });
  });

  describe('validate()', () => {
    it('should return empty array for valid source', () => {
      const errors = validate('cell TestCell {}');
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid source', () => {
      const errors = validate('cell {}');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('stringify()', () => {
    it('should roundtrip through parse and stringify', () => {
      const source = `cell TestCell {
  name: "Test"
  type: logic

  components {
    ms TestService
  }
}
`;
      const ast = parseOrThrow(source);
      const output = stringify(ast);
      const reparsed = parseOrThrow(output);

      expect(reparsed.statements).toHaveLength(1);
      expect(reparsed.statements[0].type).toBe('CellDefinition');
    });

    it('should escape special characters in strings', () => {
      const source = `cell TestCell {
  name: "Test with \\"quotes\\" and\\nnewline"
}
`;
      const ast = parseOrThrow(source);

      const cell = ast.statements[0];
      if (cell.type === 'CellDefinition') {
        expect(cell.name).toBe('Test with "quotes" and\nnewline');
      }
    });
  });
});

describe('All Component Types', () => {
  const componentTypes = [
    ['ms', 'microservice'],
    ['fn', 'function'],
    ['db', 'database'],
    ['gw', 'gateway'],
    ['svc', 'service'],
    ['broker', 'broker'],
    ['cache', 'cache'],
    ['legacy', 'legacy'],
    ['esb', 'esb'],
    ['idp', 'idp'],
  ] as const;

  it.each(componentTypes)('should parse %s as %s', (short, full) => {
    const source = `cell TestCell { components { ${short} TestComp } }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.components[0].componentType).toBe(full);
    }
  });
});

describe('All Cell Types', () => {
  const cellTypes = ['logic', 'integration', 'legacy', 'data', 'security', 'channel'];

  it.each(cellTypes)('should parse cell type %s', (cellType) => {
    const source = `cell TestCell { type: ${cellType} }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.cellType).toBe(cellType);
    }
  });
});

describe('All Endpoint Types', () => {
  const endpointTypes = ['api', 'event', 'stream'];

  it.each(endpointTypes)('should parse endpoint type %s', (epType) => {
    const source = `cell TestCell { components { gw TestGw } expose { ${epType}: TestGw } }`;
    const result = parse(source);

    expect(result.success).toBe(true);

    const cell = result.ast!.statements[0];
    if (cell.type === 'CellDefinition') {
      expect(cell.exposedEndpoints[0].endpointType).toBe(epType);
    }
  });
});

/**
 * Hook for managing Cell Diagrams state
 */

import { useState, useCallback, useMemo } from 'react';
import { parse } from '@cell-diagrams/core';
import type { ParseError } from '@cell-diagrams/core';

export interface DiagramStats {
  nodeCount: number;
  edgeCount: number;
}

export interface UseDiagramStateResult {
  source: string;
  setSource: (source: string) => void;
  errors: ParseError[];
  stats: DiagramStats;
}

export function useDiagramState(initialSource: string): UseDiagramStateResult {
  const [source, setSource] = useState(initialSource);

  // Parse the source and compute errors/stats
  const parseResult = useMemo(() => {
    if (!source.trim()) {
      return {
        errors: [],
        stats: { nodeCount: 0, edgeCount: 0 },
      };
    }

    const result = parse(source);

    if (!result.success || !result.ast) {
      return {
        errors: result.errors,
        stats: { nodeCount: 0, edgeCount: 0 },
      };
    }

    // Count nodes and edges
    let nodeCount = 0;
    let edgeCount = 0;

    for (const stmt of result.ast.statements) {
      if (stmt.type === 'CellDefinition') {
        nodeCount++;
        // Count internal connections from flow definitions
        for (const flow of stmt.flows) {
          edgeCount += flow.flows.length;
        }
      }
      if (stmt.type === 'ExternalDefinition' || stmt.type === 'UserDefinition' || stmt.type === 'ApplicationDefinition') {
        nodeCount++;
      }
      if (stmt.type === 'FlowDefinition') {
        // Count top-level flow connections
        edgeCount += stmt.flows.length;
      }
    }

    return {
      errors: [],
      stats: { nodeCount, edgeCount },
    };
  }, [source]);

  const handleSetSource = useCallback((newSource: string) => {
    setSource(newSource);
  }, []);

  return {
    source,
    setSource: handleSetSource,
    errors: parseResult.errors,
    stats: parseResult.stats,
  };
}

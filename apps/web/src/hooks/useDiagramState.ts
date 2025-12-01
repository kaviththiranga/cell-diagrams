/**
 * Hook for managing Cell Diagrams state
 * Uses enhanced error recovery for better error display
 */

import { useState, useCallback, useMemo } from 'react';
import {
  parseWithRecovery,
  type EnhancedParseError,
  type ErrorCategory,
} from '@cell-diagrams/core';

export interface DiagramStats {
  nodeCount: number;
  edgeCount: number;
  errorNodeCount: number;
}

export interface ErrorCounts {
  error: number;
  warning: number;
  info: number;
  total: number;
}

export interface UseDiagramStateResult {
  source: string;
  setSource: (source: string) => void;
  errors: EnhancedParseError[];
  errorsByCategory: Map<ErrorCategory, EnhancedParseError[]>;
  errorCounts: ErrorCounts;
  stats: DiagramStats;
  isComplete: boolean;
  hasPartialResult: boolean;
}

export function useDiagramState(initialSource: string): UseDiagramStateResult {
  const [source, setSource] = useState(initialSource);

  // Parse the source and compute errors/stats
  const parseResult = useMemo(() => {
    if (!source.trim()) {
      return {
        errors: [] as EnhancedParseError[],
        errorsByCategory: new Map<ErrorCategory, EnhancedParseError[]>(),
        errorCounts: { error: 0, warning: 0, info: 0, total: 0 },
        stats: { nodeCount: 0, edgeCount: 0, errorNodeCount: 0 },
        isComplete: true,
        hasPartialResult: false,
      };
    }

    // Use enhanced error-tolerant parsing
    const result = parseWithRecovery(source);

    // Group errors by category
    const errorsByCategory = new Map<ErrorCategory, EnhancedParseError[]>();
    for (const error of result.errors) {
      const existing = errorsByCategory.get(error.category) ?? [];
      existing.push(error);
      errorsByCategory.set(error.category, existing);
    }

    // Count errors by severity
    const errorCounts: ErrorCounts = {
      error: result.errors.filter((e) => e.severity === 'error').length,
      warning: result.errors.filter((e) => e.severity === 'warning').length,
      info: result.errors.filter((e) => e.severity === 'info').length,
      total: result.errors.length,
    };

    // Count nodes and edges even with errors (partial AST)
    let nodeCount = 0;
    let edgeCount = 0;

    if (result.ast) {
      for (const stmt of result.ast.statements) {
        if (stmt.type === 'CellDefinition') {
          nodeCount++;
          // Count internal connections from flow definitions
          for (const flow of stmt.flows) {
            if (flow.type !== 'ErrorNode') {
              edgeCount += flow.flows.length;
            }
          }
        }
        if (stmt.type === 'ExternalDefinition' || stmt.type === 'UserDefinition' || stmt.type === 'ApplicationDefinition') {
          nodeCount++;
        }
        if (stmt.type === 'FlowDefinition') {
          // Count top-level flow connections
          edgeCount += stmt.flows.length;
        }
        // Don't count ErrorNodes as regular nodes
      }
    }

    return {
      errors: result.errors,
      errorsByCategory,
      errorCounts,
      stats: {
        nodeCount,
        edgeCount,
        errorNodeCount: result.errorNodeCount,
      },
      isComplete: result.isComplete,
      hasPartialResult: !!result.ast && result.errors.length > 0,
    };
  }, [source]);

  const handleSetSource = useCallback((newSource: string) => {
    setSource(newSource);
  }, []);

  return {
    source,
    setSource: handleSetSource,
    errors: parseResult.errors,
    errorsByCategory: parseResult.errorsByCategory,
    errorCounts: parseResult.errorCounts,
    stats: parseResult.stats,
    isComplete: parseResult.isComplete,
    hasPartialResult: parseResult.hasPartialResult,
  };
}

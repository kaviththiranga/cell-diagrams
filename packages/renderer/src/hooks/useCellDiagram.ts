/**
 * useCellDiagram Hook
 *
 * React hook for managing Cell Diagram state.
 */

import { useMemo } from 'react';
import { parse } from '@cell-diagrams/core';
import { astToDiagram, applyLayout } from '../converter';
import type { DiagramState, LayoutOptions } from '../types';

export interface UseCellDiagramOptions {
  source?: string;
  layoutOptions?: LayoutOptions;
}

export interface UseCellDiagramResult {
  /** The diagram state with nodes and edges */
  diagram: DiagramState;
  /** Whether the source was parsed successfully */
  success: boolean;
  /** Parse errors, if any */
  errors: Array<{
    message: string;
    line: number;
    column: number;
  }>;
}

/**
 * Hook to parse Cell Diagrams source and convert to React Flow state.
 */
export function useCellDiagram(options: UseCellDiagramOptions): UseCellDiagramResult {
  const { source = '', layoutOptions } = options;

  return useMemo(() => {
    if (!source.trim()) {
      return {
        diagram: { nodes: [], edges: [] },
        success: true,
        errors: [],
      };
    }

    const parseResult = parse(source);

    if (!parseResult.success || !parseResult.ast) {
      return {
        diagram: { nodes: [], edges: [] },
        success: false,
        errors: parseResult.errors.map((e) => ({
          message: e.message,
          line: e.line,
          column: e.column,
        })),
      };
    }

    // Convert AST to diagram
    const diagram = astToDiagram(parseResult.ast);

    // Apply layout
    const layoutedDiagram = applyLayout(diagram, layoutOptions);

    return {
      diagram: layoutedDiagram,
      success: true,
      errors: [],
    };
  }, [source, layoutOptions]);
}

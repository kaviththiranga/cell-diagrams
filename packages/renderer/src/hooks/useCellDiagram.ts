/**
 * useCellDiagram Hook
 *
 * React hook for managing Cell Diagram state.
 */

import { useMemo } from 'react';
import { parse } from '@cell-diagrams/core';
import { astToDiagram, applyLayoutWithEngine } from '../converter';
import type { DiagramState, LayoutOptions } from '../types';
import type { LayoutEngineOptions } from '../layout';

export interface UseCellDiagramOptions {
  source?: string;
  layoutOptions?: LayoutOptions;
  /** Options for the new layout engine (auto-positioning, dynamic sizing, etc.) */
  layoutEngineOptions?: Partial<LayoutEngineOptions>;
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
 * Uses the new LayoutEngine for auto-positioning with:
 * - Two-graph strategy (linked/unlinked node separation)
 * - Dynamic cell sizing
 * - Grid fallback for overlaps
 * - Boundary positioning for externals
 * - Bezier edge routing
 */
export function useCellDiagram(options: UseCellDiagramOptions): UseCellDiagramResult {
  const { source = '', layoutEngineOptions } = options;

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

    // Apply layout using the new LayoutEngine
    const layoutedDiagram = applyLayoutWithEngine(diagram, layoutEngineOptions);

    return {
      diagram: layoutedDiagram,
      success: true,
      errors: [],
    };
  }, [source, layoutEngineOptions]);
}

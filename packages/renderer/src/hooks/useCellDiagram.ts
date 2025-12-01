/**
 * useCellDiagram Hook
 *
 * React hook for managing Cell Diagram state.
 * Uses error-tolerant parsing for partial diagram rendering.
 */

import { useMemo } from 'react';
import {
  parseWithRecovery,
  type EnhancedParseError,
  type ErrorCategory,
} from '@cell-diagrams/core';
import { astToDiagram, applyLayoutWithEngine } from '../converter';
import type { DiagramState } from '../types';
import type { LayoutEngineOptions } from '../layout';

export interface UseCellDiagramOptions {
  source?: string | undefined;
  layoutOptions?: Partial<LayoutEngineOptions> | undefined;
}

export interface UseCellDiagramResult {
  /** The diagram state with nodes and edges */
  diagram: DiagramState;
  /** Whether the source was parsed successfully (no errors) */
  success: boolean;
  /** Whether the AST is complete (no ErrorNodes) */
  isComplete: boolean;
  /** Whether we have a partial result (AST exists but has errors) */
  hasPartialResult: boolean;
  /** Number of ErrorNodes in the AST */
  errorNodeCount: number;
  /** Enhanced parse errors with categories, severities, and hints */
  errors: EnhancedParseError[];
  /** Errors grouped by category */
  errorsByCategory: Map<ErrorCategory, EnhancedParseError[]>;
  /** Count of errors by severity */
  errorCounts: {
    error: number;
    warning: number;
    info: number;
    total: number;
  };
}

/**
 * Hook to parse Cell Diagrams source and convert to React Flow state.
 * Uses error-tolerant parsing for partial diagram rendering.
 *
 * Features:
 * - Partial AST generation even with errors
 * - Enhanced error messages with recovery hints
 * - Error categorization and severity levels
 * - Three-zone layout approach
 */
export function useCellDiagram(options: UseCellDiagramOptions): UseCellDiagramResult {
  const { source = '', layoutOptions } = options;

  return useMemo(() => {
    // Empty state for empty source
    if (!source.trim()) {
      return {
        diagram: { nodes: [], edges: [] },
        success: true,
        isComplete: true,
        hasPartialResult: false,
        errorNodeCount: 0,
        errors: [],
        errorsByCategory: new Map(),
        errorCounts: { error: 0, warning: 0, info: 0, total: 0 },
      };
    }

    // Use error-tolerant parsing
    const parseResult = parseWithRecovery(source);

    // Group errors by category
    const errorsByCategory = new Map<ErrorCategory, EnhancedParseError[]>();
    for (const error of parseResult.errors) {
      const existing = errorsByCategory.get(error.category) ?? [];
      existing.push(error);
      errorsByCategory.set(error.category, existing);
    }

    // Count errors by severity
    const errorCounts = {
      error: parseResult.errors.filter((e) => e.severity === 'error').length,
      warning: parseResult.errors.filter((e) => e.severity === 'warning').length,
      info: parseResult.errors.filter((e) => e.severity === 'info').length,
      total: parseResult.errors.length,
    };

    // Check if we have an AST to work with (partial or complete)
    const hasAst = !!parseResult.ast;
    const hasPartialResult = hasAst && parseResult.errors.length > 0;

    // If we have no AST at all, return empty diagram
    if (!hasAst) {
      return {
        diagram: { nodes: [], edges: [] },
        success: false,
        isComplete: false,
        hasPartialResult: false,
        errorNodeCount: 0,
        errors: parseResult.errors,
        errorsByCategory,
        errorCounts,
      };
    }

    // Convert AST to diagram (works with partial AST containing ErrorNodes)
    const diagram = astToDiagram(parseResult.ast);

    // Apply three-zone layout using the new LayoutEngine
    const layoutedDiagram = applyLayoutWithEngine(diagram, layoutOptions ?? {});

    return {
      diagram: layoutedDiagram,
      success: parseResult.success,
      isComplete: parseResult.isComplete,
      hasPartialResult,
      errorNodeCount: parseResult.errorNodeCount,
      errors: parseResult.errors,
      errorsByCategory,
      errorCounts,
    };
  }, [source, layoutOptions]);
}

/**
 * Get severity color for error display
 */
export function getSeverityColor(severity: 'error' | 'warning' | 'info'): string {
  switch (severity) {
    case 'error':
      return '#dc2626'; // Red
    case 'warning':
      return '#f59e0b'; // Amber
    case 'info':
      return '#3b82f6'; // Blue
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: ErrorCategory): string {
  switch (category) {
    case 'lexical':
      return 'Lexical Errors';
    case 'syntactic':
      return 'Syntax Errors';
    case 'structural':
      return 'Structural Errors';
    case 'semantic':
      return 'Semantic Errors';
    default:
      return 'Other Errors';
  }
}

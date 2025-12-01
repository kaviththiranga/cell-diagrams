/**
 * CellDiagram Component
 *
 * Main component for rendering Cell Diagrams.
 * Supports partial rendering with error visualization.
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { useCellDiagram } from '../hooks/useCellDiagram';
import { ErrorPanel } from './ErrorPanel';
import type { CellDiagramProps, DiagramNodeData, ConnectionEdgeData } from '../types';

import '@xyflow/react/dist/style.css';

export function CellDiagram({
  source = '',
  layoutOptions,
  onNodeClick,
  onEdgeClick,
  fitView = true,
  className = '',
  showPartialOnError = true,
  onErrorClick,
  showErrorPanel = true,
  errorPanelPosition = 'bottom',
}: CellDiagramProps) {
  const {
    diagram,
    success,
    hasPartialResult,
    errors,
    errorsByCategory,
    errorCounts,
  } = useCellDiagram({
    source,
    layoutOptions,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);

  // Update nodes/edges when diagram changes
  if (
    JSON.stringify(diagram.nodes) !== JSON.stringify(nodes) ||
    JSON.stringify(diagram.edges) !== JSON.stringify(edges)
  ) {
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
  }

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (onNodeClick) {
        onNodeClick(node.id, node.data as DiagramNodeData);
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.id, edge.data as ConnectionEdgeData);
      }
    },
    [onEdgeClick]
  );

  // Determine what to show based on state
  const showDiagram = success || (hasPartialResult && showPartialOnError);
  const showErrors = errors.length > 0 && showErrorPanel;

  // Memoize the error panel to prevent unnecessary re-renders
  const errorPanel = useMemo(() => {
    if (!showErrors) return null;

    return (
      <ErrorPanel
        errors={errors}
        errorsByCategory={errorsByCategory}
        errorCounts={errorCounts}
        onErrorClick={onErrorClick}
        position={errorPanelPosition}
        collapsible={true}
        defaultCollapsed={showDiagram} // Collapse if showing diagram
      />
    );
  }, [showErrors, errors, errorsByCategory, errorCounts, onErrorClick, errorPanelPosition, showDiagram]);

  // Show only error box if no diagram to show
  if (!showDiagram && errors.length > 0) {
    return (
      <div className={`cell-diagram-container cell-diagram-error-only ${className}`}>
        <div className="cell-diagram-error">
          <div className="error-title">
            <span className="error-title-icon"></span>
            Parse Errors
            <span className="error-count-badge">{errorCounts.total}</span>
          </div>
          <div className="error-summary">
            {errorCounts.error > 0 && (
              <span className="error-summary-item error-summary-item--error">
                {errorCounts.error} error{errorCounts.error !== 1 ? 's' : ''}
              </span>
            )}
            {errorCounts.warning > 0 && (
              <span className="error-summary-item error-summary-item--warning">
                {errorCounts.warning} warning{errorCounts.warning !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <ul className="error-list">
            {errors.slice(0, 10).map((error, idx) => (
              <li
                key={idx}
                className={`error-list-item error-list-item--${error.severity}`}
                onClick={() => onErrorClick?.(error)}
                role="button"
                tabIndex={0}
              >
                <span className="error-list-location">
                  Line {error.line}:{error.column}
                </span>
                <span className="error-list-message">{error.message}</span>
                {error.recoveryHint && (
                  <span className="error-list-hint">
                    <span className="hint-icon"></span>
                    {error.recoveryHint}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {errors.length > 10 && (
            <div className="error-more">
              +{errors.length - 10} more error{errors.length - 10 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout classes based on error panel position
  const containerClass = [
    'cell-diagram-container',
    showErrors ? `cell-diagram-container--with-errors` : '',
    showErrors ? `cell-diagram-container--errors-${errorPanelPosition}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {/* Main diagram */}
      <div className={`cell-diagram ${hasPartialResult ? 'cell-diagram--partial' : ''}`}>
        {/* Partial result indicator */}
        {hasPartialResult && (
          <div className="cell-diagram-partial-indicator">
            <span className="partial-icon"></span>
            Partial diagram - {errorCounts.total} error{errorCounts.total !== 1 ? 's' : ''} found
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes as NodeTypes}
          edgeTypes={edgeTypes as EdgeTypes}
          fitView={fitView}
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* Error panel */}
      {errorPanel}
    </div>
  );
}

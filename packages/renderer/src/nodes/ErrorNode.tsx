/**
 * ErrorNode Component
 *
 * Visual representation of an ErrorNode in the diagram.
 * Shows parse errors with severity indicators and recovery hints.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ErrorNodeData } from '../types';

export type { ErrorNodeData };

export interface ErrorNodeProps extends NodeProps {
  data: ErrorNodeData;
}

/**
 * Get icon for error severity
 */
function getSeverityIcon(severity: 'error' | 'warning' | 'info'): string {
  switch (severity) {
    case 'error':
      return ''; // X mark
    case 'warning':
      return ''; // Warning triangle
    case 'info':
      return ''; // Info circle
    default:
      return '';
  }
}

/**
 * Get category label
 */
function getCategoryLabel(category: string): string {
  switch (category) {
    case 'lexical':
      return 'Lexical';
    case 'syntactic':
      return 'Syntax';
    case 'structural':
      return 'Structure';
    case 'semantic':
      return 'Semantic';
    default:
      return 'Error';
  }
}

/**
 * ErrorNode - Visual component for parse errors in the diagram
 */
export const ErrorNode = memo(function ErrorNode({ data, selected }: ErrorNodeProps) {
  const {
    message,
    severity = 'error',
    category = 'syntactic',
    recoveryHint,
    line,
    column,
    ruleName,
  } = data;

  return (
    <div
      className={`error-node error-node--${severity} ${selected ? 'selected' : ''}`}
      title={recoveryHint ?? message}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="error-node-handle"
      />

      {/* Severity icon */}
      <div className={`error-node-icon error-node-icon--${severity}`}>
        {getSeverityIcon(severity)}
      </div>

      {/* Content */}
      <div className="error-node-content">
        {/* Category badge */}
        <div className={`error-node-category error-node-category--${category}`}>
          {getCategoryLabel(category)}
        </div>

        {/* Error message */}
        <div className="error-node-message">
          {message.length > 50 ? `${message.substring(0, 47)}...` : message}
        </div>

        {/* Location info */}
        {(line !== undefined || column !== undefined) && (
          <div className="error-node-location">
            {line !== undefined && `Line ${line}`}
            {line !== undefined && column !== undefined && ':'}
            {column !== undefined && column}
          </div>
        )}

        {/* Recovery hint */}
        {recoveryHint && (
          <div className="error-node-hint">
            <span className="error-node-hint-icon"></span>
            {recoveryHint.length > 40 ? `${recoveryHint.substring(0, 37)}...` : recoveryHint}
          </div>
        )}

        {/* Rule name (for debugging) */}
        {ruleName && (
          <div className="error-node-rule">
            in {ruleName}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="error-node-handle"
      />
    </div>
  );
});

export default ErrorNode;

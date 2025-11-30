/**
 * ExternalNode Component - Minimalist Excalidraw-style
 *
 * Renders a circular node with cloud icon inside (filled for external services).
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExternalNode as ExternalNodeType, ExternalNodeData } from '../types';
import { CloudIcon } from './icons';

function ExternalNodeComponent({ data, selected }: NodeProps<ExternalNodeType>) {
  const extData = data as ExternalNodeData;

  return (
    <div className={`excalidraw-node external-node ${selected ? 'selected' : ''}`}>
      {/* Handles for all four directions */}
      <Handle type="target" position={Position.Top} id="top" className="excalidraw-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="excalidraw-handle" />
      <Handle type="target" position={Position.Left} id="left" className="excalidraw-handle" />
      <Handle type="source" position={Position.Right} id="right" className="excalidraw-handle" />

      {/* Circular icon container - filled background for external */}
      <div className="excalidraw-circle external-circle filled">
        <CloudIcon size={24} color="#ffffff" />
      </div>

      {/* Label below - can be multi-line */}
      <div className="excalidraw-label external-label">
        {extData.label}
        {extData.externalType && (
          <span className="external-type-hint">({extData.externalType})</span>
        )}
      </div>
    </div>
  );
}

export const ExternalNode = memo(ExternalNodeComponent);

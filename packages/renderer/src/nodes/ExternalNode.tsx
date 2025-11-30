/**
 * ExternalNode Component
 *
 * Renders an external system (SaaS, partner API, etc.)
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExternalNode as ExternalNodeType, ExternalNodeData } from '../types';

function ExternalNodeComponent({ data, selected }: NodeProps<ExternalNodeType>) {
  const extData = data as ExternalNodeData;
  return (
    <div className={`external-node ${selected ? 'selected' : ''}`}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="external-handle" />

      {/* Icon */}
      <div className="external-node-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>

      {/* Label */}
      <div className="external-node-label">{extData.label}</div>

      {/* Type badge */}
      {extData.externalType && (
        <div className="external-node-type">{extData.externalType}</div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="external-handle" />
    </div>
  );
}

export const ExternalNode = memo(ExternalNodeComponent);

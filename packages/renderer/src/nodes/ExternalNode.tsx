/**
 * ExternalNode Component
 *
 * Renders an external system (SaaS, partner API, enterprise system)
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ExternalNode as ExternalNodeType, ExternalNodeData } from '../types';
import { EXTERNAL_TYPE_ICONS } from '../types';

function ExternalNodeComponent({ data, selected }: NodeProps<ExternalNodeType>) {
  const extData = data as ExternalNodeData;
  const icon = EXTERNAL_TYPE_ICONS[extData.externalType] ?? '🌐';

  return (
    <div className={`external-node external-${extData.externalType} ${selected ? 'selected' : ''}`}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="external-handle" />

      {/* Icon */}
      <div className="external-node-icon">{icon}</div>

      {/* Label */}
      <div className="external-node-label">{extData.label}</div>

      {/* Type badge */}
      <div className="external-node-type">{extData.externalType}</div>

      {/* Provides endpoints */}
      {extData.provides && extData.provides.length > 0 && (
        <div className="external-node-provides">
          {extData.provides.map((ep, idx) => (
            <span key={idx} className={`provides-badge provides-${ep}`}>
              {ep}
            </span>
          ))}
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="external-handle" />
    </div>
  );
}

export const ExternalNode = memo(ExternalNodeComponent);

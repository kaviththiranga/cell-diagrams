/**
 * GatewayNode - Minimalist Excalidraw-style gateway
 *
 * Renders a circular node with bidirectional arrows icon.
 * Positioned on cell boundary (north, south, east, west).
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { GatewayIcon } from './icons';

export type GatewayPosition = 'north' | 'south' | 'east' | 'west';

export interface GatewayNodeData extends Record<string, unknown> {
  type: 'gateway';
  id: string;
  label: string;
  gatewayType: 'external' | 'internal' | 'egress';
  /** Position on cell boundary */
  position?: GatewayPosition;
  parentCell?: string;
  exposes?: string[];
  policies?: string[];
  hasAuth?: boolean;
  authType?: string;
}

export type GatewayNodeType = Node<GatewayNodeData, 'gateway'>;

function GatewayNodeComponent({ data, selected }: NodeProps<GatewayNodeType>) {
  const nodeData = data as GatewayNodeData;

  // Use provided label or generate from gatewayType
  const typeLabel = nodeData.label || (
    nodeData.gatewayType === 'external'
      ? 'External gateway'
      : nodeData.gatewayType === 'egress'
        ? 'Egress gateway'
        : 'Internal gateway'
  );

  // Determine position on cell boundary
  const pos = nodeData.position ?? 'north';

  return (
    <div className={`excalidraw-node gateway-node gateway-${pos} ${selected ? 'selected' : ''}`}>
      {/* Handles for all four directions */}
      <Handle type="target" position={Position.Top} id="top" className="excalidraw-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="excalidraw-handle" />
      <Handle type="target" position={Position.Left} id="left" className="excalidraw-handle" />
      <Handle type="source" position={Position.Right} id="right" className="excalidraw-handle" />

      {/* Label above for north/south, to the side for east/west */}
      <div className={`excalidraw-label-above gateway-label-${pos}`}>{typeLabel}</div>

      {/* Circular icon container */}
      <div className="excalidraw-circle gateway-circle">
        <GatewayIcon size={24} color="#1e1e1e" />
      </div>
    </div>
  );
}

export const GatewayNode = memo(GatewayNodeComponent);

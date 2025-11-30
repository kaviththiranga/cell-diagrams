/**
 * ComponentNode - Minimalist Excalidraw-style component
 *
 * Renders a circular node with an icon inside and label below.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { getComponentIcon } from './icons';
import type { ComponentType } from '@cell-diagrams/core';

export interface ComponentNodeData extends Record<string, unknown> {
  type: 'component';
  id: string;
  label: string;
  componentType: ComponentType;
  parentCell?: string;
  attributes?: Record<string, unknown>;
  sidecars?: string[];
}

export type ComponentNodeType = Node<ComponentNodeData, 'component'>;

function ComponentNodeComponent({ data, selected }: NodeProps<ComponentNodeType>) {
  const nodeData = data as ComponentNodeData;
  const Icon = getComponentIcon(nodeData.componentType);

  return (
    <div className={`excalidraw-node component-node ${selected ? 'selected' : ''}`}>
      {/* Handles for all four directions */}
      <Handle type="target" position={Position.Top} id="top" className="excalidraw-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="excalidraw-handle" />
      <Handle type="target" position={Position.Left} id="left" className="excalidraw-handle" />
      <Handle type="source" position={Position.Right} id="right" className="excalidraw-handle" />

      {/* Circular icon container */}
      <div className="excalidraw-circle">
        <Icon size={24} color="#1e1e1e" />
      </div>

      {/* Label below */}
      <div className="excalidraw-label">{nodeData.label}</div>
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeComponent);

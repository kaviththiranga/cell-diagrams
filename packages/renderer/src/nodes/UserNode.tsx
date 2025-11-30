/**
 * UserNode Component - Minimalist Excalidraw-style
 *
 * Renders a circular node with person icon inside.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UserNode as UserNodeType, UserNodeData } from '../types';
import { UserIcon } from './icons';

function UserNodeComponent({ data, selected }: NodeProps<UserNodeType>) {
  const userData = data as UserNodeData;

  return (
    <div className={`excalidraw-node user-node ${selected ? 'selected' : ''}`}>
      {/* Handles for all four directions */}
      <Handle type="target" position={Position.Top} id="top" className="excalidraw-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="excalidraw-handle" />
      <Handle type="target" position={Position.Left} id="left" className="excalidraw-handle" />
      <Handle type="source" position={Position.Right} id="right" className="excalidraw-handle" />

      {/* Circular icon container */}
      <div className="excalidraw-circle user-circle">
        <UserIcon size={28} color="#1e1e1e" />
      </div>

      {/* Label below */}
      <div className="excalidraw-label">{userData.label}</div>
    </div>
  );
}

export const UserNode = memo(UserNodeComponent);

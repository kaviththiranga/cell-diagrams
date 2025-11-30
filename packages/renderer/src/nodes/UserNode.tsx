/**
 * UserNode Component
 *
 * Renders a user/actor in the diagram.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UserNode as UserNodeType, UserNodeData } from '../types';

function UserNodeComponent({ data, selected }: NodeProps<UserNodeType>) {
  const userData = data as UserNodeData;
  // Check if user is internal or external based on attributes
  const typeAttr = userData.attributes.find((a) => a.key === 'type');
  const isInternal = typeAttr?.value === 'internal';

  return (
    <div className={`user-node ${selected ? 'selected' : ''} ${isInternal ? 'internal' : 'external'}`}>
      {/* User Icon */}
      <div className="user-node-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* Label */}
      <div className="user-node-label">{userData.label}</div>

      {/* Output Handle (users typically connect TO cells) */}
      <Handle type="source" position={Position.Bottom} className="user-handle" />
    </div>
  );
}

export const UserNode = memo(UserNodeComponent);

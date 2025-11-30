/**
 * UserNode Component
 *
 * Renders a user/actor (external customer, internal employee, system)
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UserNode as UserNodeType, UserNodeData } from '../types';
import { USER_TYPE_ICONS } from '../types';

function UserNodeComponent({ data, selected }: NodeProps<UserNodeType>) {
  const userData = data as UserNodeData;
  const icon = USER_TYPE_ICONS[userData.userType] ?? '👤';

  return (
    <div className={`user-node user-${userData.userType} ${selected ? 'selected' : ''}`}>
      {/* User Icon */}
      <div className="user-node-icon">{icon}</div>

      {/* Label */}
      <div className="user-node-label">{userData.label}</div>

      {/* Type badge */}
      <div className="user-node-type">{userData.userType}</div>

      {/* Channels */}
      {userData.channels && userData.channels.length > 0 && (
        <div className="user-node-channels">
          {userData.channels.map((channel, idx) => (
            <span key={idx} className="channel-badge">
              {channel}
            </span>
          ))}
        </div>
      )}

      {/* Output Handle (users typically connect TO cells) */}
      <Handle type="source" position={Position.Bottom} className="user-handle" />
    </div>
  );
}

export const UserNode = memo(UserNodeComponent);

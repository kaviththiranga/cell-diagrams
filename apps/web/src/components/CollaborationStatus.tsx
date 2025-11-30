/**
 * Collaboration Status Component
 *
 * Shows connection status and connected users.
 */

import type { ConnectionStatus, AwarenessState, CollabUser } from '@cell-diagrams/collab-client';

interface CollaborationStatusProps {
  status: ConnectionStatus;
  users: AwarenessState[];
  currentUser: CollabUser;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function CollaborationStatus({
  status,
  users,
  currentUser,
  onConnect,
  onDisconnect,
}: CollaborationStatusProps) {
  const otherUsers = users.filter((u) => u.user.id !== currentUser.id);

  return (
    <div className="collab-status">
      {/* Connection Status */}
      <div className={`collab-status-indicator status-${status}`}>
        <span className="status-dot" />
        <span className="status-text">
          {status === 'connected' && 'Connected'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'disconnected' && 'Disconnected'}
          {status === 'error' && 'Error'}
        </span>
      </div>

      {/* User Avatars */}
      {users.length > 0 && (
        <div className="collab-users">
          {/* Current user */}
          <div
            className="collab-avatar current"
            style={{ borderColor: currentUser.color }}
            title={`${currentUser.name} (you)`}
          >
            {getInitials(currentUser.name)}
          </div>

          {/* Other users */}
          {otherUsers.slice(0, 4).map((state) => (
            <div
              key={state.user.id}
              className="collab-avatar"
              style={{ borderColor: state.user.color }}
              title={state.user.name}
            >
              {getInitials(state.user.name)}
            </div>
          ))}

          {/* Overflow indicator */}
          {otherUsers.length > 4 && (
            <div className="collab-avatar overflow" title={`${otherUsers.length - 4} more users`}>
              +{otherUsers.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Connect/Disconnect Button */}
      {status === 'disconnected' ? (
        <button className="collab-button" onClick={onConnect} title="Connect to collaboration server">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Connect
        </button>
      ) : status === 'connected' ? (
        <button
          className="collab-button disconnect"
          onClick={onDisconnect}
          title="Disconnect from collaboration server"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Disconnect
        </button>
      ) : null}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * React Hooks for Collaboration
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CollabProvider, createCollabProvider } from './provider';
import type {
  CollabProviderConfig,
  ConnectionStatus,
  AwarenessState,
  CursorPosition,
  SelectionRange,
  CollabUser,
} from './types';
import { generateUserId, getRandomColor } from './types';

/**
 * Options for useCollaboration hook
 */
export interface UseCollaborationOptions {
  /** WebSocket server URL */
  serverUrl: string;
  /** Room/document name */
  roomName: string;
  /** User display name (optional, will generate random if not provided) */
  userName?: string;
  /** User color (optional, will use random if not provided) */
  userColor?: string;
  /** Initial content (used if joining empty room) */
  initialContent?: string;
  /** Authentication token */
  token?: string;
  /** Whether to auto-connect (default: true) */
  autoConnect?: boolean;
}

/**
 * Result of useCollaboration hook
 */
export interface UseCollaborationResult {
  /** Current document content */
  content: string;
  /** Set document content */
  setContent: (content: string) => void;
  /** Connection status */
  status: ConnectionStatus;
  /** Whether connected */
  isConnected: boolean;
  /** Connected users (including self) */
  users: AwarenessState[];
  /** Current user */
  currentUser: CollabUser;
  /** Connect to server */
  connect: () => void;
  /** Disconnect from server */
  disconnect: () => void;
  /** Update cursor position */
  updateCursor: (position: CursorPosition | null) => void;
  /** Update selection */
  updateSelection: (selection: SelectionRange | null) => void;
  /** The underlying provider (for advanced usage) */
  provider: CollabProvider | null;
}

/**
 * React hook for real-time collaboration
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationResult {
  const {
    serverUrl,
    roomName,
    userName,
    userColor,
    initialContent = '',
    token,
    autoConnect = true,
  } = options;

  // Generate stable user identity
  const currentUser = useMemo<CollabUser>(() => ({
    id: generateUserId(),
    name: userName || `User ${Math.floor(Math.random() * 1000)}`,
    color: userColor || getRandomColor(),
  }), [userName, userColor]);

  const [provider, setProvider] = useState<CollabProvider | null>(null);
  const [content, setContentState] = useState(initialContent);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [users, setUsers] = useState<AwarenessState[]>([]);
  const initialContentRef = useRef(initialContent);

  // Create provider on mount
  useEffect(() => {
    const config: CollabProviderConfig = {
      serverUrl,
      roomName,
      user: currentUser,
      token,
      autoConnect,
    };

    const newProvider = createCollabProvider(config, {
      onStatusChange: setStatus,
      onDocumentChange: setContentState,
      onAwarenessChange: (states) => {
        setUsers(Array.from(states.values()));
      },
      onSync: () => {
        // If document is empty after sync, set initial content
        if (newProvider.getContent() === '' && initialContentRef.current) {
          newProvider.setContent(initialContentRef.current);
        }
      },
      onError: (error) => {
        console.error('Collaboration error:', error);
      },
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [serverUrl, roomName, currentUser, token, autoConnect]);

  // Set content function
  const setContent = useCallback((newContent: string) => {
    if (provider) {
      provider.setContent(newContent);
    } else {
      setContentState(newContent);
    }
  }, [provider]);

  // Connect function
  const connect = useCallback(() => {
    provider?.connect();
  }, [provider]);

  // Disconnect function
  const disconnect = useCallback(() => {
    provider?.disconnect();
  }, [provider]);

  // Update cursor function
  const updateCursor = useCallback((position: CursorPosition | null) => {
    provider?.updateCursor(position);
  }, [provider]);

  // Update selection function
  const updateSelection = useCallback((selection: SelectionRange | null) => {
    provider?.updateSelection(selection);
  }, [provider]);

  return {
    content,
    setContent,
    status,
    isConnected: status === 'connected',
    users,
    currentUser,
    connect,
    disconnect,
    updateCursor,
    updateSelection,
    provider,
  };
}

/**
 * Hook to get other users' cursors (excluding self)
 */
export function useRemoteCursors(users: AwarenessState[], currentUserId: string): AwarenessState[] {
  return useMemo(() => {
    return users.filter((state) => state.user.id !== currentUserId && state.cursor);
  }, [users, currentUserId]);
}

/**
 * Hook to get other users' selections (excluding self)
 */
export function useRemoteSelections(users: AwarenessState[], currentUserId: string): AwarenessState[] {
  return useMemo(() => {
    return users.filter((state) => state.user.id !== currentUserId && state.selection);
  }, [users, currentUserId]);
}

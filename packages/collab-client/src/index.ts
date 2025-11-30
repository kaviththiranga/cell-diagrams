/**
 * @cell-diagrams/collab-client
 *
 * Yjs collaboration client for Cell Diagrams.
 */

// Types
export type {
  CollabUser,
  CursorPosition,
  SelectionRange,
  AwarenessState,
  ConnectionStatus,
  CollabProviderConfig,
  CollabProviderEvents,
  ICollabProvider,
} from './types';

export {
  USER_COLORS,
  getRandomColor,
  generateUserId,
} from './types';

// Provider
export { CollabProvider, createCollabProvider } from './provider';

// React Hooks
export {
  useCollaboration,
  useRemoteCursors,
  useRemoteSelections,
} from './hooks';

export type {
  UseCollaborationOptions,
  UseCollaborationResult,
} from './hooks';

// Re-export useful Yjs types
export type { Doc as YDoc, Text as YText } from 'yjs';
export type { Awareness } from 'y-protocols/awareness';

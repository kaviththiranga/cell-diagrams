/**
 * Collaboration Types
 */

import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';

/**
 * User information for awareness
 */
export interface CollabUser {
  /** Unique user ID */
  id: string;
  /** Display name */
  name: string;
  /** User color (hex) */
  color: string;
}

/**
 * Cursor position in the editor
 */
export interface CursorPosition {
  /** Line number (0-based) */
  line: number;
  /** Column number (0-based) */
  column: number;
}

/**
 * Selection range in the editor
 */
export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

/**
 * User awareness state
 */
export interface AwarenessState {
  user: CollabUser;
  cursor?: CursorPosition;
  selection?: SelectionRange;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Collaboration provider configuration
 */
export interface CollabProviderConfig {
  /** WebSocket server URL */
  serverUrl: string;
  /** Room/document name */
  roomName: string;
  /** Current user information */
  user: CollabUser;
  /** Connection token (optional) */
  token?: string | undefined;
  /** Auto-connect on creation (default: true) */
  autoConnect?: boolean | undefined;
}

/**
 * Event callbacks for the collaboration provider
 */
export interface CollabProviderEvents {
  /** Called when connection status changes */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Called when awareness changes (users join/leave, cursor moves) */
  onAwarenessChange?: (states: Map<number, AwarenessState>) => void;
  /** Called when document content changes */
  onDocumentChange?: (content: string) => void;
  /** Called on sync complete */
  onSync?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Collaboration provider interface
 */
export interface ICollabProvider {
  /** The Yjs document */
  readonly doc: Y.Doc;
  /** The awareness instance */
  readonly awareness: Awareness;
  /** Current connection status */
  readonly status: ConnectionStatus;
  /** Connected users */
  readonly users: Map<number, AwarenessState>;

  /** Connect to the server */
  connect(): void;
  /** Disconnect from the server */
  disconnect(): void;
  /** Destroy the provider */
  destroy(): void;

  /** Get the current document content */
  getContent(): string;
  /** Set the document content */
  setContent(content: string): void;

  /** Update local cursor position */
  updateCursor(position: CursorPosition | null): void;
  /** Update local selection */
  updateSelection(selection: SelectionRange | null): void;
}

/**
 * Predefined colors for users
 */
export const USER_COLORS = [
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#2563eb', // Blue
  '#16a34a', // Green
  '#ea580c', // Orange
];

/**
 * Get a random user color
 */
export function getRandomColor(): string {
  const index = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[index] ?? USER_COLORS[0]!;
}

/**
 * Generate a random user ID
 */
export function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15);
}

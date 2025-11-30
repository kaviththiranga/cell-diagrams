/**
 * Collaboration Provider
 *
 * Manages Yjs document synchronization and awareness via WebSocket.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import type {
  CollabProviderConfig,
  CollabProviderEvents,
  ConnectionStatus,
  AwarenessState,
  CursorPosition,
  SelectionRange,
  ICollabProvider,
} from './types';

/**
 * Collaboration provider using Yjs and WebSocket
 */
export class CollabProvider implements ICollabProvider {
  public readonly doc: Y.Doc;
  public readonly awareness: Awareness;

  private wsProvider: WebsocketProvider | null = null;
  private text: Y.Text;
  private config: CollabProviderConfig;
  private events: CollabProviderEvents;
  private _status: ConnectionStatus = 'disconnected';
  private _users: Map<number, AwarenessState> = new Map();

  constructor(config: CollabProviderConfig, events: CollabProviderEvents = {}) {
    this.config = config;
    this.events = events;

    // Create Yjs document
    this.doc = new Y.Doc();
    this.text = this.doc.getText('content');
    this.awareness = new Awareness(this.doc);

    // Set local user state
    this.awareness.setLocalStateField('user', config.user);

    // Listen for text changes
    this.text.observe(this.handleTextChange.bind(this));

    // Listen for awareness changes
    this.awareness.on('change', this.handleAwarenessChange.bind(this));

    // Auto-connect if configured
    if (config.autoConnect !== false) {
      this.connect();
    }
  }

  /**
   * Get current connection status
   */
  get status(): ConnectionStatus {
    return this._status;
  }

  /**
   * Get connected users
   */
  get users(): Map<number, AwarenessState> {
    return new Map(this._users);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.wsProvider) {
      return;
    }

    this.setStatus('connecting');

    try {
      const params: Record<string, string> = {};
      if (this.config.token) {
        params['token'] = this.config.token;
      }

      this.wsProvider = new WebsocketProvider(
        this.config.serverUrl,
        this.config.roomName,
        this.doc,
        {
          awareness: this.awareness,
          params,
        }
      );

      // Handle connection events
      this.wsProvider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          this.setStatus('connected');
        } else if (event.status === 'disconnected') {
          this.setStatus('disconnected');
        }
      });

      this.wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced && this.events.onSync) {
          this.events.onSync();
        }
      });

      this.wsProvider.on('connection-error', (event: Event) => {
        this.setStatus('error');
        if (this.events.onError) {
          this.events.onError(new Error(`Connection error: ${event.type}`));
        }
      });
    } catch (error) {
      this.setStatus('error');
      if (this.events.onError) {
        this.events.onError(error as Error);
      }
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect();
      this.wsProvider.destroy();
      this.wsProvider = null;
      this.setStatus('disconnected');
    }
  }

  /**
   * Destroy the provider and clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.awareness.destroy();
    this.doc.destroy();
  }

  /**
   * Get the current document content
   */
  getContent(): string {
    return this.text.toString();
  }

  /**
   * Set the document content
   */
  setContent(content: string): void {
    this.doc.transact(() => {
      this.text.delete(0, this.text.length);
      this.text.insert(0, content);
    });
  }

  /**
   * Apply a text change (for editor integration)
   */
  applyDelta(index: number, deleteCount: number, insertText: string): void {
    this.doc.transact(() => {
      if (deleteCount > 0) {
        this.text.delete(index, deleteCount);
      }
      if (insertText) {
        this.text.insert(index, insertText);
      }
    });
  }

  /**
   * Update local cursor position
   */
  updateCursor(position: CursorPosition | null): void {
    this.awareness.setLocalStateField('cursor', position);
  }

  /**
   * Update local selection
   */
  updateSelection(selection: SelectionRange | null): void {
    this.awareness.setLocalStateField('selection', selection);
  }

  /**
   * Handle text changes from Yjs
   */
  private handleTextChange(): void {
    if (this.events.onDocumentChange) {
      this.events.onDocumentChange(this.text.toString());
    }
  }

  /**
   * Handle awareness changes
   */
  private handleAwarenessChange(): void {
    const states = this.awareness.getStates() as Map<number, AwarenessState>;
    this._users = new Map(states);

    if (this.events.onAwarenessChange) {
      this.events.onAwarenessChange(this._users);
    }
  }

  /**
   * Set connection status and emit event
   */
  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    if (this.events.onStatusChange) {
      this.events.onStatusChange(status);
    }
  }
}

/**
 * Create a collaboration provider
 */
export function createCollabProvider(
  config: CollabProviderConfig,
  events?: CollabProviderEvents
): CollabProvider {
  return new CollabProvider(config, events);
}

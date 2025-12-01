/**
 * Browser Entry Point
 *
 * Entry point for the language server running in a browser context
 * (e.g., as a Web Worker for Monaco editor).
 */

import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from 'vscode-languageserver/browser';
import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createServer } from '../server';

/**
 * Create a browser-compatible language server connection
 *
 * This function is intended to be called from a Web Worker context.
 *
 * @example
 * ```typescript
 * // In a Web Worker file (lsp-worker.ts):
 * import { createBrowserServer } from '@cell-diagrams/language-server/browser';
 * createBrowserServer();
 * ```
 */
export function createBrowserServer(): void {
  // In a Web Worker, `self` is the global scope
  const messageReader = new BrowserMessageReader(self as unknown as Worker);
  const messageWriter = new BrowserMessageWriter(self as unknown as Worker);

  const connection = createConnection(messageReader, messageWriter);
  const documents = new TextDocuments(TextDocument);

  createServer(connection, documents);

  connection.listen();
}

/**
 * Create a connection using a MessagePort
 *
 * Useful when running the server in a SharedWorker or with explicit ports.
 */
export function createPortServer(port: MessagePort): void {
  const messageReader = new BrowserMessageReader(port);
  const messageWriter = new BrowserMessageWriter(port);

  const connection = createConnection(messageReader, messageWriter);
  const documents = new TextDocuments(TextDocument);

  createServer(connection, documents);

  connection.listen();
}

// Auto-start if running as a worker
declare const self: Worker | undefined;
if (typeof self !== 'undefined' && 'postMessage' in self) {
  // Check if we're in a dedicated worker context
  const workerSelf = self as Worker & { name?: string };
  if (workerSelf.name === 'celldl-lsp' || workerSelf.name === '' || !workerSelf.name) {
    createBrowserServer();
  }
}

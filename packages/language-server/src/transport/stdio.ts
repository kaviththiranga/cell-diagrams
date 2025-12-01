/**
 * Stdio Transport
 *
 * Creates an LSP server using stdio for communication.
 * This is the standard transport for VSCode extensions.
 */

import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createServer } from '../server';

/**
 * Start the language server with stdio transport
 */
export function startStdioServer(): void {
  // Create a connection using stdio
  const connection = createConnection(ProposedFeatures.all);

  // Create a document manager
  const documents = new TextDocuments(TextDocument);

  // Create and configure the server
  createServer(connection, documents);

  // Start listening
  connection.listen();
}

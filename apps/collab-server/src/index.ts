/**
 * Cell Diagrams Collaboration Server
 *
 * Hocuspocus server for real-time collaboration on Cell Diagrams.
 */

import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Throttle } from '@hocuspocus/extension-throttle';
import { Database } from '@hocuspocus/extension-database';
import SQLite from 'better-sqlite3';
import { config } from 'dotenv';

// Load environment variables
config();

// Configuration
const PORT = parseInt(process.env['PORT'] || '1234', 10);
const HOST = process.env['HOST'] || '0.0.0.0';
const DATABASE_PATH = process.env['DATABASE_PATH'] || './data/collab.db';
const MAX_CONNECTIONS_PER_DOCUMENT = parseInt(process.env['MAX_CONNECTIONS'] || '50', 10);
const THROTTLE_INTERVAL = parseInt(process.env['THROTTLE_INTERVAL'] || '100', 10);

// Initialize SQLite database
const db = new SQLite(DATABASE_PATH);

// Create documents table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    name TEXT PRIMARY KEY,
    data BLOB,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepare statements
const getDocument = db.prepare('SELECT data FROM documents WHERE name = ?');
const saveDocument = db.prepare(`
  INSERT INTO documents (name, data, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(name) DO UPDATE SET
    data = excluded.data,
    updated_at = CURRENT_TIMESTAMP
`);

// Create Hocuspocus server
const server = Server.configure({
  name: 'cell-diagrams-collab',
  port: PORT,
  address: HOST,

  // Extensions
  extensions: [
    // Logging
    new Logger({
      log: (message) => {
        console.log(`[${new Date().toISOString()}] ${message}`);
      },
      onLoadDocument: true,
      onStoreDocument: true,
      onConnect: true,
      onDisconnect: true,
      onChange: false, // Too noisy
    }),

    // Rate limiting
    new Throttle({
      throttle: THROTTLE_INTERVAL,
    }),

    // Persistence
    new Database({
      fetch: async ({ documentName }) => {
        const row = getDocument.get(documentName) as { data: Buffer } | undefined;
        return row?.data ?? null;
      },
      store: async ({ documentName, state }) => {
        saveDocument.run(documentName, state);
      },
    }),
  ],

  // Hooks
  async onAuthenticate({ token, documentName }) {
    // Optional: Implement authentication
    // For now, allow all connections
    console.log(`Auth attempt for document: ${documentName}, token: ${token ? 'provided' : 'none'}`);
    return {};
  },

  async onConnect({ documentName, connection }) {
    console.log(`Client connected to document: ${documentName}`);

    // Check connection limit
    const connectionCount = server.getConnectionsCount();
    if (connectionCount > MAX_CONNECTIONS_PER_DOCUMENT) {
      throw new Error('Maximum connections reached');
    }
  },

  async onDisconnect({ documentName }) {
    console.log(`Client disconnected from document: ${documentName}`);
  },

  async onLoadDocument({ document, documentName }) {
    console.log(`Loading document: ${documentName}`);
  },

  async onStoreDocument({ documentName }) {
    console.log(`Storing document: ${documentName}`);
  },

  async onDestroy() {
    console.log('Server shutting down...');
    db.close();
  },
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down...');
  await server.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down...');
  await server.destroy();
  process.exit(0);
});

// Start server
console.log(`
╔═══════════════════════════════════════════════════════╗
║         Cell Diagrams Collaboration Server            ║
╠═══════════════════════════════════════════════════════╣
║  Port:        ${String(PORT).padEnd(40)}║
║  Host:        ${HOST.padEnd(40)}║
║  Database:    ${DATABASE_PATH.padEnd(40)}║
║  Max Conns:   ${String(MAX_CONNECTIONS_PER_DOCUMENT).padEnd(40)}║
╚═══════════════════════════════════════════════════════╝
`);

server.listen();

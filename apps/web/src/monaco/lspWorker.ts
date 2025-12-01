/**
 * LSP Worker
 *
 * Web Worker that runs the CellDL language server.
 * This file is bundled as a separate worker by Vite.
 */

import { createBrowserServer } from '@cell-diagrams/language-server/browser';

// Start the language server
createBrowserServer();

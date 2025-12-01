/**
 * Cell Diagrams VS Code Extension
 *
 * Provides syntax highlighting, language server features, and diagram preview for Cell Diagrams DSL.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { DiagramPreviewPanel } from './preview';
import { DiagnosticsProvider } from './diagnostics';

let client: LanguageClient | undefined;
let diagnosticsProvider: DiagnosticsProvider | undefined;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Cell Diagrams extension activated');

  const config = vscode.workspace.getConfiguration('cellDiagrams');
  const useLsp = config.get<boolean>('languageServer.enabled', true);

  if (useLsp) {
    // Use the language server
    client = await startLanguageClient(context);
  } else {
    // Fallback to the legacy diagnostics provider
    diagnosticsProvider = new DiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);
  }

  // Register preview commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cell-diagrams.showPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'cell-diagrams') {
        DiagramPreviewPanel.createOrShow(context.extensionUri, editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cell-diagrams.showPreviewToSide', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'cell-diagrams') {
        DiagramPreviewPanel.createOrShow(context.extensionUri, editor.document, true);
      }
    })
  );

  // Update preview when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'cell-diagrams') {
        DiagramPreviewPanel.updateIfVisible(e.document);
      }
    })
  );

  // Update preview when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === 'cell-diagrams') {
        DiagramPreviewPanel.updateIfVisible(editor.document);
      }
    })
  );
}

/**
 * Start the language client
 */
async function startLanguageClient(
  context: vscode.ExtensionContext
): Promise<LanguageClient> {
  // Path to the language server module
  const serverModule = context.asAbsolutePath(
    path.join('node_modules', '@cell-diagrams', 'language-server', 'bin', 'celldl-lsp.js')
  );

  // Server options for both run and debug
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: {
        execArgv: ['--nolazy', '--inspect=6009'],
      },
    },
  };

  // Client options
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'cell-diagrams' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.cell'),
    },
  };

  // Create and start the client
  const client = new LanguageClient(
    'cellDiagramsLanguageServer',
    'CellDL Language Server',
    serverOptions,
    clientOptions
  );

  // Register client for disposal
  context.subscriptions.push(client);

  // Start the client
  await client.start();

  console.log('CellDL Language Server started');

  return client;
}

/**
 * Extension deactivation
 */
export async function deactivate(): Promise<void> {
  console.log('Cell Diagrams extension deactivated');

  if (client) {
    await client.stop();
  }

  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
  }
}

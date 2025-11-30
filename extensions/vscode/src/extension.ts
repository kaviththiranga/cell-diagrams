/**
 * Cell Diagrams VS Code Extension
 *
 * Provides syntax highlighting, diagnostics, and diagram preview for Cell Diagrams DSL.
 */

import * as vscode from 'vscode';
import { DiagramPreviewPanel } from './preview';
import { DiagnosticsProvider } from './diagnostics';

let diagnosticsProvider: DiagnosticsProvider | undefined;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Cell Diagrams extension activated');

  // Initialize diagnostics provider
  diagnosticsProvider = new DiagnosticsProvider();
  context.subscriptions.push(diagnosticsProvider);

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
 * Extension deactivation
 */
export function deactivate(): void {
  console.log('Cell Diagrams extension deactivated');
  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
  }
}

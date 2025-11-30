/**
 * Diagnostics Provider
 *
 * Provides real-time error diagnostics for Cell Diagrams files.
 */

import * as vscode from 'vscode';
import { parse } from '@cell-diagrams/core';

export class DiagnosticsProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('cell-diagrams');
    this.disposables.push(this.diagnosticCollection);

    // Update diagnostics for open documents
    vscode.workspace.textDocuments.forEach((doc) => {
      if (doc.languageId === 'cell-diagrams') {
        this.updateDiagnostics(doc);
      }
    });

    // Listen for document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId === 'cell-diagrams') {
          this.debouncedUpdateDiagnostics(e.document);
        }
      })
    );

    // Listen for document opens
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === 'cell-diagrams') {
          this.updateDiagnostics(doc);
        }
      })
    );

    // Clear diagnostics when document closes
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
        this.debounceTimers.delete(doc.uri.toString());
      })
    );
  }

  /**
   * Debounced diagnostics update to avoid excessive parsing
   */
  private debouncedUpdateDiagnostics(document: vscode.TextDocument): void {
    const key = document.uri.toString();

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const config = vscode.workspace.getConfiguration('cellDiagrams');
    const delay = config.get<number>('preview.refreshDelay', 300);

    const timer = setTimeout(() => {
      this.updateDiagnostics(document);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Update diagnostics for a document
   */
  private updateDiagnostics(document: vscode.TextDocument): void {
    const source = document.getText();
    const result = parse(source);

    const diagnostics: vscode.Diagnostic[] = result.errors.map((error) => {
      const line = Math.max(0, error.line - 1);
      const column = Math.max(0, error.column - 1);

      const range = new vscode.Range(
        new vscode.Position(line, column),
        new vscode.Position(line, column + Math.max(1, error.length))
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        error.message,
        vscode.DiagnosticSeverity.Error
      );

      diagnostic.source = 'Cell Diagrams';

      return diagnostic;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Dispose of subscriptions
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}

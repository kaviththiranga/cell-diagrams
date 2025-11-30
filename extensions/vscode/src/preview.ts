/**
 * Diagram Preview Panel
 *
 * Webview panel for rendering Cell Diagrams as visual diagrams.
 */

import * as vscode from 'vscode';
import { parse, stringify } from '@cell-diagrams/core';
import type { Program, CellDefinition, ExternalDefinition, UserDefinition, Connection } from '@cell-diagrams/core';

export class DiagramPreviewPanel {
  public static currentPanel: DiagramPreviewPanel | undefined;

  private static readonly viewType = 'cellDiagramsPreview';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private currentDocument: vscode.TextDocument | undefined;
  private disposables: vscode.Disposable[] = [];

  /**
   * Create or show the preview panel
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    toSide: boolean = false
  ): void {
    const column = toSide
      ? vscode.ViewColumn.Beside
      : vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

    // If we already have a panel, show it
    if (DiagramPreviewPanel.currentPanel) {
      DiagramPreviewPanel.currentPanel.panel.reveal(column);
      DiagramPreviewPanel.currentPanel.update(document);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      DiagramPreviewPanel.viewType,
      'Cell Diagram Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    DiagramPreviewPanel.currentPanel = new DiagramPreviewPanel(panel, extensionUri, document);
  }

  /**
   * Update the preview if it's currently visible
   */
  public static updateIfVisible(document: vscode.TextDocument): void {
    if (DiagramPreviewPanel.currentPanel) {
      DiagramPreviewPanel.currentPanel.update(document);
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.currentDocument = document;

    // Set initial content
    this.panel.webview.html = this.getWebviewContent();
    this.update(document);

    // Handle disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            this.update(document);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  /**
   * Update the preview with new document content
   */
  public update(document: vscode.TextDocument): void {
    this.currentDocument = document;
    const source = document.getText();
    const result = parse(source);

    if (result.success && result.ast) {
      const diagramData = this.astToDiagramData(result.ast);
      this.panel.webview.postMessage({
        type: 'update',
        data: diagramData,
        errors: [],
      });
    } else {
      this.panel.webview.postMessage({
        type: 'update',
        data: null,
        errors: result.errors,
      });
    }
  }

  /**
   * Convert AST to simplified diagram data for the webview
   */
  private astToDiagramData(ast: Program): DiagramData {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    for (const stmt of ast.statements) {
      if (stmt.type === 'CellDefinition') {
        nodes.push(this.cellToNode(stmt));
      } else if (stmt.type === 'ExternalDefinition') {
        nodes.push(this.externalToNode(stmt));
      } else if (stmt.type === 'UserDefinition') {
        nodes.push(this.userToNode(stmt));
      } else if (stmt.type === 'Connection') {
        edges.push(this.connectionToEdge(stmt));
      }
    }

    return { nodes, edges };
  }

  private cellToNode(cell: CellDefinition): DiagramNode {
    return {
      id: cell.id,
      type: 'cell',
      label: cell.name || cell.id,
      cellType: cell.cellType,
      components: cell.components.map((c) => ({
        id: c.id,
        type: c.componentType,
      })),
    };
  }

  private externalToNode(ext: ExternalDefinition): DiagramNode {
    return {
      id: ext.id,
      type: 'external',
      label: ext.name || ext.id,
      externalType: ext.externalType,
    };
  }

  private userToNode(user: UserDefinition): DiagramNode {
    return {
      id: user.id,
      type: 'user',
      label: user.id,
    };
  }

  private connectionToEdge(conn: Connection): DiagramEdge {
    const labelAttr = conn.attributes.find((a) => a.key === 'label');
    return {
      id: `${conn.source}-${conn.target}`,
      source: conn.source,
      target: conn.target,
      label: typeof labelAttr?.value === 'string' ? labelAttr.value : undefined,
    };
  }

  /**
   * Generate the webview HTML content
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Cell Diagram Preview</title>
  <style>
    :root {
      --cell-color: #4f46e5;
      --external-color: #6b7280;
      --user-color: #7c3aed;
      --connection-color: #94a3b8;
      --bg-color: var(--vscode-editor-background);
      --text-color: var(--vscode-editor-foreground);
      --border-color: var(--vscode-panel-border);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--text-color);
      background: var(--bg-color);
      min-height: 100vh;
      overflow: hidden;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 16px;
    }

    .diagram {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      align-content: flex-start;
      overflow: auto;
      padding: 16px;
    }

    .node {
      background: var(--vscode-editor-background);
      border: 2px solid var(--cell-color);
      border-radius: 8px;
      padding: 12px;
      min-width: 180px;
      max-width: 280px;
    }

    .node.cell {
      border-color: var(--cell-color);
    }

    .node.external {
      border-color: var(--external-color);
      border-style: dashed;
      border-radius: 50%;
      width: 120px;
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-width: auto;
    }

    .node.user {
      border-color: var(--user-color);
      width: 100px;
      text-align: center;
      min-width: auto;
    }

    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }

    .node-title {
      font-weight: 600;
      font-size: 14px;
    }

    .node-type {
      font-size: 10px;
      text-transform: uppercase;
      padding: 2px 6px;
      background: var(--cell-color);
      color: white;
      border-radius: 4px;
    }

    .node.external .node-type {
      background: var(--external-color);
    }

    .components {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .component {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 4px 8px;
      background: var(--vscode-input-background);
      border-radius: 4px;
    }

    .component-type {
      font-size: 10px;
      padding: 2px 4px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px;
      text-transform: uppercase;
    }

    .connections {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .connections-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
    }

    .connection {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      padding: 4px 0;
    }

    .connection-arrow {
      color: var(--connection-color);
    }

    .connection-label {
      font-style: italic;
      color: var(--vscode-descriptionForeground);
    }

    .error-container {
      padding: 16px;
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .error-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-errorForeground);
    }

    .error-list {
      list-style: none;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }

    .error-item {
      padding: 4px 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="errors"></div>
    <div id="diagram" class="diagram"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const errorsContainer = document.getElementById('errors');
    const diagramContainer = document.getElementById('diagram');

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;

      if (message.type === 'update') {
        renderDiagram(message.data, message.errors);
      }
    });

    function renderDiagram(data, errors) {
      // Clear containers
      errorsContainer.innerHTML = '';
      diagramContainer.innerHTML = '';

      // Show errors if any
      if (errors && errors.length > 0) {
        errorsContainer.innerHTML = \`
          <div class="error-container">
            <div class="error-title">Parse Errors</div>
            <ul class="error-list">
              \${errors.map(e => \`<li class="error-item">Line \${e.line}:\${e.column}: \${e.message}</li>\`).join('')}
            </ul>
          </div>
        \`;
      }

      // Show empty state if no data
      if (!data || data.nodes.length === 0) {
        diagramContainer.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div>No diagram to display</div>
            <div style="margin-top: 8px; font-size: 12px;">Add cell, external, or user definitions to see your diagram</div>
          </div>
        \`;
        return;
      }

      // Render nodes
      data.nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = \`node \${node.type}\`;
        nodeEl.innerHTML = renderNode(node);
        diagramContainer.appendChild(nodeEl);
      });

      // Render connections summary
      if (data.edges.length > 0) {
        const connectionsEl = document.createElement('div');
        connectionsEl.className = 'connections';
        connectionsEl.innerHTML = \`
          <div class="connections-title">Connections (\${data.edges.length})</div>
          \${data.edges.map(edge => \`
            <div class="connection">
              <span>\${edge.source}</span>
              <span class="connection-arrow">→</span>
              <span>\${edge.target}</span>
              \${edge.label ? \`<span class="connection-label">"\${edge.label}"</span>\` : ''}
            </div>
          \`).join('')}
        \`;
        diagramContainer.appendChild(connectionsEl);
      }
    }

    function renderNode(node) {
      if (node.type === 'cell') {
        return \`
          <div class="node-header">
            <span class="node-title">\${node.label}</span>
            \${node.cellType ? \`<span class="node-type">\${node.cellType}</span>\` : ''}
          </div>
          \${node.components && node.components.length > 0 ? \`
            <div class="components">
              \${node.components.map(c => \`
                <div class="component">
                  <span class="component-type">\${c.type}</span>
                  <span>\${c.id}</span>
                </div>
              \`).join('')}
            </div>
          \` : ''}
        \`;
      } else if (node.type === 'external') {
        return \`
          <span class="node-title">\${node.label}</span>
          \${node.externalType ? \`<span class="node-type">\${node.externalType}</span>\` : ''}
        \`;
      } else if (node.type === 'user') {
        return \`
          <div style="font-size: 24px; margin-bottom: 4px;">👤</div>
          <span class="node-title">\${node.label}</span>
        \`;
      }
      return '';
    }

    // Signal ready
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
  }

  /**
   * Dispose of the panel
   */
  public dispose(): void {
    DiagramPreviewPanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

// Types for diagram data
interface DiagramNode {
  id: string;
  type: 'cell' | 'external' | 'user';
  label: string;
  cellType?: string;
  externalType?: string;
  components?: Array<{ id: string; type: string }>;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

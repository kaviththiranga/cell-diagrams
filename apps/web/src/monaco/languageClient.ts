/**
 * Monaco Language Client
 *
 * Connects the Monaco editor to the CellDL language server running in a Web Worker.
 * Uses a direct worker-based approach that bridges LSP messages to Monaco APIs.
 */

import type * as Monaco from 'monaco-editor';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageserver-protocol/browser';
import type {
  CompletionItem,
  CompletionList,
  Hover,
  Location,
  SymbolInformation,
  TextEdit,
  WorkspaceEdit,
  Message,
} from 'vscode-languageserver-protocol';
import { LANGUAGE_ID } from './cellDiagramsLanguage';

// LSP message types
interface LSPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface LSPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface LSPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

type LSPMessage = LSPRequest | LSPResponse | LSPNotification;

let worker: Worker | null = null;
let messageReader: BrowserMessageReader | null = null;
let messageWriter: BrowserMessageWriter | null = null;
let requestId = 0;
let initialized = false;
const pendingRequests = new Map<number, {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}>();
const disposables: Monaco.IDisposable[] = [];

// Document version tracking
const documentVersions = new Map<string, number>();

/**
 * Send an LSP request and wait for response
 */
async function sendRequest<T>(method: string, params?: unknown): Promise<T> {
  if (!messageWriter) {
    throw new Error('Language client not initialized');
  }

  const id = ++requestId;
  const request: LSPRequest = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve: resolve as (result: unknown) => void, reject });
    messageWriter!.write(request);
  });
}

/**
 * Send an LSP notification (no response expected)
 */
function sendNotification(method: string, params?: unknown): void {
  if (!messageWriter) return;

  const notification: LSPNotification = {
    jsonrpc: '2.0',
    method,
    params,
  };

  messageWriter.write(notification);
}

/**
 * Handle incoming LSP messages
 */
function handleMessage(message: Message): void {
  const msg = message as unknown as LSPMessage;

  // Handle responses to our requests
  if ('id' in msg && msg.id !== undefined) {
    const pending = pendingRequests.get(msg.id as number);
    if (pending) {
      pendingRequests.delete(msg.id as number);
      if ('error' in msg && msg.error) {
        pending.reject(new Error(msg.error.message));
      } else {
        pending.resolve((msg as LSPResponse).result);
      }
    }
    return;
  }

  // Handle notifications from server
  if ('method' in msg) {
    const notification = msg as LSPNotification;
    if (notification.method === 'textDocument/publishDiagnostics') {
      // Diagnostics are handled - we could update Monaco markers here
      // but the current Editor component handles this via props
      console.log('Received diagnostics:', notification.params);
    }
  }
}

/**
 * Convert Monaco Position to LSP Position
 */
function fromMonacoPosition(position: Monaco.IPosition): { line: number; character: number } {
  return {
    line: position.lineNumber - 1,
    character: position.column - 1,
  };
}

/**
 * Convert LSP Range to Monaco Range
 */
function toMonacoRange(range: { start: { line: number; character: number }; end: { line: number; character: number } }): Monaco.IRange {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

/**
 * Convert LSP CompletionItemKind to Monaco CompletionItemKind
 */
function toMonacoCompletionKind(kind: number | undefined, monaco: typeof Monaco): Monaco.languages.CompletionItemKind {
  const kindMap: Record<number, Monaco.languages.CompletionItemKind> = {
    1: monaco.languages.CompletionItemKind.Text,
    2: monaco.languages.CompletionItemKind.Method,
    3: monaco.languages.CompletionItemKind.Function,
    4: monaco.languages.CompletionItemKind.Constructor,
    5: monaco.languages.CompletionItemKind.Field,
    6: monaco.languages.CompletionItemKind.Variable,
    7: monaco.languages.CompletionItemKind.Class,
    8: monaco.languages.CompletionItemKind.Interface,
    9: monaco.languages.CompletionItemKind.Module,
    10: monaco.languages.CompletionItemKind.Property,
    11: monaco.languages.CompletionItemKind.Unit,
    12: monaco.languages.CompletionItemKind.Value,
    13: monaco.languages.CompletionItemKind.Enum,
    14: monaco.languages.CompletionItemKind.Keyword,
    15: monaco.languages.CompletionItemKind.Snippet,
    16: monaco.languages.CompletionItemKind.Color,
    17: monaco.languages.CompletionItemKind.File,
    18: monaco.languages.CompletionItemKind.Reference,
    19: monaco.languages.CompletionItemKind.Folder,
    20: monaco.languages.CompletionItemKind.EnumMember,
    21: monaco.languages.CompletionItemKind.Constant,
    22: monaco.languages.CompletionItemKind.Struct,
    23: monaco.languages.CompletionItemKind.Event,
    24: monaco.languages.CompletionItemKind.Operator,
    25: monaco.languages.CompletionItemKind.TypeParameter,
  };
  return kindMap[kind ?? 1] ?? monaco.languages.CompletionItemKind.Text;
}

/**
 * Convert LSP SymbolKind to Monaco SymbolKind
 */
function toMonacoSymbolKind(kind: number, monaco: typeof Monaco): Monaco.languages.SymbolKind {
  const kindMap: Record<number, Monaco.languages.SymbolKind> = {
    1: monaco.languages.SymbolKind.File,
    2: monaco.languages.SymbolKind.Module,
    3: monaco.languages.SymbolKind.Namespace,
    4: monaco.languages.SymbolKind.Package,
    5: monaco.languages.SymbolKind.Class,
    6: monaco.languages.SymbolKind.Method,
    7: monaco.languages.SymbolKind.Property,
    8: monaco.languages.SymbolKind.Field,
    9: monaco.languages.SymbolKind.Constructor,
    10: monaco.languages.SymbolKind.Enum,
    11: monaco.languages.SymbolKind.Interface,
    12: monaco.languages.SymbolKind.Function,
    13: monaco.languages.SymbolKind.Variable,
    14: monaco.languages.SymbolKind.Constant,
    15: monaco.languages.SymbolKind.String,
    16: monaco.languages.SymbolKind.Number,
    17: monaco.languages.SymbolKind.Boolean,
    18: monaco.languages.SymbolKind.Array,
    19: monaco.languages.SymbolKind.Object,
    20: monaco.languages.SymbolKind.Key,
    21: monaco.languages.SymbolKind.Null,
    22: monaco.languages.SymbolKind.EnumMember,
    23: monaco.languages.SymbolKind.Struct,
    24: monaco.languages.SymbolKind.Event,
    25: monaco.languages.SymbolKind.Operator,
    26: monaco.languages.SymbolKind.TypeParameter,
  };
  return kindMap[kind] ?? monaco.languages.SymbolKind.Variable;
}

/**
 * Get document URI for a model
 */
function getDocumentUri(model: Monaco.editor.ITextModel): string {
  return model.uri.toString();
}

/**
 * Initialize the language client
 */
export async function startLanguageClient(monaco: typeof Monaco): Promise<void> {
  if (initialized) {
    return;
  }

  // Create the worker
  worker = new Worker(
    new URL('./lspWorker.ts', import.meta.url),
    { type: 'module', name: 'celldl-lsp' }
  );

  // Create message reader/writer
  messageReader = new BrowserMessageReader(worker);
  messageWriter = new BrowserMessageWriter(worker);

  // Listen for messages
  messageReader.listen(handleMessage);

  // Initialize the language server
  await sendRequest('initialize', {
    processId: null,
    capabilities: {
      textDocument: {
        completion: {
          completionItem: {
            snippetSupport: true,
            documentationFormat: ['markdown', 'plaintext'],
          },
        },
        hover: {
          contentFormat: ['markdown', 'plaintext'],
        },
        definition: {},
        references: {},
        documentSymbol: {},
        rename: {
          prepareSupport: true,
        },
        formatting: {},
      },
    },
    rootUri: null,
  });

  // Send initialized notification
  sendNotification('initialized', {});

  initialized = true;

  // Register Monaco providers
  registerProviders(monaco);

  console.log('CellDL Language Client started');
}

/**
 * Register Monaco language providers
 */
function registerProviders(monaco: typeof Monaco): void {
  // Completion provider
  disposables.push(
    monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
      triggerCharacters: ['.', ':', '<', '-', '@'],
      async provideCompletionItems(model, position) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<CompletionList | CompletionItem[] | null>(
            'textDocument/completion',
            {
              textDocument: { uri },
              position: fromMonacoPosition(position),
            }
          );

          if (!result) return { suggestions: [] };

          const items = Array.isArray(result) ? result : result.items;

          const suggestions: Monaco.languages.CompletionItem[] = items.map((item) => {
            const suggestion: Monaco.languages.CompletionItem = {
              label: item.label,
              kind: toMonacoCompletionKind(item.kind, monaco),
              insertText: item.insertText ?? item.label,
              range: undefined as unknown as Monaco.IRange,
            };
            if (item.insertTextFormat === 2) {
              suggestion.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }
            if (typeof item.documentation === 'string') {
              suggestion.documentation = item.documentation;
            } else if (item.documentation?.value) {
              suggestion.documentation = item.documentation.value;
            }
            if (item.detail) {
              suggestion.detail = item.detail;
            }
            if (item.sortText) {
              suggestion.sortText = item.sortText;
            }
            if (item.filterText) {
              suggestion.filterText = item.filterText;
            }
            return suggestion;
          });
          return { suggestions };
        } catch (error) {
          console.error('Completion error:', error);
          return { suggestions: [] };
        }
      },
    })
  );

  // Hover provider
  disposables.push(
    monaco.languages.registerHoverProvider(LANGUAGE_ID, {
      async provideHover(model, position) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<Hover | null>(
            'textDocument/hover',
            {
              textDocument: { uri },
              position: fromMonacoPosition(position),
            }
          );

          if (!result || !result.contents) return null;

          const contents = Array.isArray(result.contents)
            ? result.contents.map((c) => {
                if (typeof c === 'string') return { value: c };
                return { value: c.value };
              })
            : typeof result.contents === 'string'
              ? [{ value: result.contents }]
              : [{ value: (result.contents as { value: string }).value }];

          const hover: Monaco.languages.Hover = { contents };
          if (result.range) {
            hover.range = toMonacoRange(result.range);
          }
          return hover;
        } catch (error) {
          console.error('Hover error:', error);
          return null;
        }
      },
    })
  );

  // Definition provider
  disposables.push(
    monaco.languages.registerDefinitionProvider(LANGUAGE_ID, {
      async provideDefinition(model, position) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<Location | Location[] | null>(
            'textDocument/definition',
            {
              textDocument: { uri },
              position: fromMonacoPosition(position),
            }
          );

          if (!result) return null;

          const locations = Array.isArray(result) ? result : [result];

          return locations.map((loc) => ({
            uri: monaco.Uri.parse(loc.uri),
            range: toMonacoRange(loc.range),
          }));
        } catch (error) {
          console.error('Definition error:', error);
          return null;
        }
      },
    })
  );

  // References provider
  disposables.push(
    monaco.languages.registerReferenceProvider(LANGUAGE_ID, {
      async provideReferences(model, position, context) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<Location[] | null>(
            'textDocument/references',
            {
              textDocument: { uri },
              position: fromMonacoPosition(position),
              context: { includeDeclaration: context.includeDeclaration },
            }
          );

          if (!result) return null;

          return result.map((loc) => ({
            uri: monaco.Uri.parse(loc.uri),
            range: toMonacoRange(loc.range),
          }));
        } catch (error) {
          console.error('References error:', error);
          return null;
        }
      },
    })
  );

  // Document symbol provider
  disposables.push(
    monaco.languages.registerDocumentSymbolProvider(LANGUAGE_ID, {
      async provideDocumentSymbols(model) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<SymbolInformation[] | null>(
            'textDocument/documentSymbol',
            {
              textDocument: { uri },
            }
          );

          if (!result) return [];

          return result.map((sym): Monaco.languages.DocumentSymbol => {
            const docSymbol: Monaco.languages.DocumentSymbol = {
              name: sym.name,
              kind: toMonacoSymbolKind(sym.kind, monaco),
              range: toMonacoRange(sym.location.range),
              selectionRange: toMonacoRange(sym.location.range),
              detail: '',
              tags: [],
            };
            if (sym.containerName) {
              (docSymbol as Monaco.languages.DocumentSymbol & { containerName?: string }).containerName = sym.containerName;
            }
            return docSymbol;
          });
        } catch (error) {
          console.error('Document symbols error:', error);
          return [];
        }
      },
    })
  );

  // Rename provider
  disposables.push(
    monaco.languages.registerRenameProvider(LANGUAGE_ID, {
      async provideRenameEdits(model, position, newName) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<WorkspaceEdit | null>(
            'textDocument/rename',
            {
              textDocument: { uri },
              position: fromMonacoPosition(position),
              newName,
            }
          );

          if (!result || !result.changes) return null;

          const edits: Monaco.languages.WorkspaceEdit = {
            edits: [],
          };

          for (const [docUri, changes] of Object.entries(result.changes)) {
            for (const change of changes as TextEdit[]) {
              edits.edits.push({
                resource: monaco.Uri.parse(docUri),
                textEdit: {
                  range: toMonacoRange(change.range),
                  text: change.newText,
                },
                versionId: undefined,
              });
            }
          }

          return edits;
        } catch (error) {
          console.error('Rename error:', error);
          return null;
        }
      },
    })
  );

  // Document formatting provider
  disposables.push(
    monaco.languages.registerDocumentFormattingEditProvider(LANGUAGE_ID, {
      async provideDocumentFormattingEdits(model, options) {
        const uri = getDocumentUri(model);
        syncDocument(model);

        try {
          const result = await sendRequest<TextEdit[] | null>(
            'textDocument/formatting',
            {
              textDocument: { uri },
              options: {
                tabSize: options.tabSize,
                insertSpaces: options.insertSpaces,
              },
            }
          );

          if (!result) return [];

          return result.map((edit) => ({
            range: toMonacoRange(edit.range),
            text: edit.newText,
          }));
        } catch (error) {
          console.error('Formatting error:', error);
          return [];
        }
      },
    })
  );
}

/**
 * Sync document content with language server
 */
function syncDocument(model: Monaco.editor.ITextModel): void {
  const uri = getDocumentUri(model);
  const version = documentVersions.get(uri) ?? 0;
  const newVersion = model.getVersionId();

  if (version === 0) {
    // Document not yet opened
    sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId: LANGUAGE_ID,
        version: newVersion,
        text: model.getValue(),
      },
    });
  } else if (version !== newVersion) {
    // Document changed
    sendNotification('textDocument/didChange', {
      textDocument: { uri, version: newVersion },
      contentChanges: [{ text: model.getValue() }],
    });
  }

  documentVersions.set(uri, newVersion);
}

/**
 * Stop the language client
 */
export async function stopLanguageClient(): Promise<void> {
  // Dispose all providers
  for (const disposable of disposables) {
    disposable.dispose();
  }
  disposables.length = 0;

  // Close documents
  for (const uri of documentVersions.keys()) {
    sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }
  documentVersions.clear();

  // Shutdown language server
  if (initialized) {
    try {
      await sendRequest('shutdown', {});
      sendNotification('exit', {});
    } catch {
      // Ignore errors during shutdown
    }
  }

  // Cleanup
  if (messageReader) {
    messageReader.dispose();
    messageReader = null;
  }
  if (messageWriter) {
    messageWriter.dispose();
    messageWriter = null;
  }
  if (worker) {
    worker.terminate();
    worker = null;
  }

  initialized = false;
  pendingRequests.clear();

  console.log('CellDL Language Client stopped');
}

/**
 * Check if the language client is running
 */
export function isLanguageClientRunning(): boolean {
  return initialized;
}

/**
 * Notify about document changes (for external sync)
 */
export function notifyDocumentChange(model: Monaco.editor.ITextModel): void {
  if (!initialized) return;
  syncDocument(model);
}

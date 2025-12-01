/**
 * Monaco Editor Component for Cell Diagrams
 * Enhanced with error recovery support and quick fixes
 */

import { useRef, useCallback, useEffect } from 'react';
import MonacoEditor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { LANGUAGE_ID, registerCellDiagramsLanguage, startLanguageClient, stopLanguageClient } from '../monaco';
import type { EnhancedParseError } from '@cell-diagrams/core';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: EnhancedParseError[];
  onErrorClick?: (error: EnhancedParseError) => void;
}

/**
 * Map error severity to Monaco marker severity
 */
function getSeverity(
  severity: 'error' | 'warning' | 'info',
  monaco: typeof Monaco
): Monaco.MarkerSeverity {
  switch (severity) {
    case 'error':
      return monaco.MarkerSeverity.Error;
    case 'warning':
      return monaco.MarkerSeverity.Warning;
    case 'info':
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Error;
  }
}

export function Editor({ value, onChange, errors = [], onErrorClick }: EditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const codeActionsDisposableRef = useRef<Monaco.IDisposable | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Cell Diagrams language
    registerCellDiagramsLanguage(monaco);

    // Set editor model to use Cell Diagrams language
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, LANGUAGE_ID);
    }

    // Apply custom theme
    monaco.editor.setTheme('cell-diagrams-dark');

    // Start the language client for LSP features
    startLanguageClient(monaco).catch((error) => {
      console.error('Failed to start language client:', error);
    });

    // Focus editor
    editor.focus();
  }, []);

  // Cleanup language client on unmount
  useEffect(() => {
    return () => {
      stopLanguageClient().catch((error) => {
        console.error('Failed to stop language client:', error);
      });
    };
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update error markers and code actions when errors change
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    if (!monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    // Create enhanced markers with severity and hints
    const markers: Monaco.editor.IMarkerData[] = errors.map((error) => {
      // Build message with hint if available
      let message = error.message;
      if (error.recoveryHint) {
        message += `\n\n💡 Hint: ${error.recoveryHint}`;
      }

      const marker: Monaco.editor.IMarkerData = {
        severity: getSeverity(error.severity, monaco),
        message,
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.endLine,
        endColumn: error.endColumn,
        source: 'CellDL',
      };
      if (error.code) {
        marker.code = `E${error.code}`;
      }
      return marker;
    });

    monaco.editor.setModelMarkers(model, 'cell-diagrams', markers);

    // Dispose previous code actions provider
    if (codeActionsDisposableRef.current) {
      codeActionsDisposableRef.current.dispose();
    }

    // Register code actions provider for quick fixes
    codeActionsDisposableRef.current = monaco.languages.registerCodeActionProvider(
      LANGUAGE_ID,
      {
        provideCodeActions(
          actionModel,
          _range,
          context
        ): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
          const actions: Monaco.languages.CodeAction[] = [];

          // Find matching errors for this range
          for (const marker of context.markers) {
            // Find the error that matches this marker
            const matchingError = errors.find(
              (e) =>
                e.line === marker.startLineNumber &&
                e.column === marker.startColumn
            );

            if (matchingError?.suggestedFix) {
              const fix = matchingError.suggestedFix;
              actions.push({
                title: `🔧 ${fix.description}`,
                kind: 'quickfix',
                diagnostics: [marker],
                isPreferred: true,
                edit: {
                  edits: [
                    {
                      resource: actionModel.uri,
                      textEdit: {
                        range: {
                          startLineNumber: matchingError.line,
                          startColumn: matchingError.column,
                          endLineNumber: matchingError.endLine,
                          endColumn: matchingError.endColumn,
                        },
                        text: fix.replacement,
                      },
                      versionId: undefined,
                    },
                  ],
                },
              });
            }
          }

          return {
            actions,
            dispose: () => {},
          };
        },
      }
    );

    // Cleanup on unmount
    return () => {
      if (codeActionsDisposableRef.current) {
        codeActionsDisposableRef.current.dispose();
      }
    };
  }, [errors]);

  // Handle clicking on error markers
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco || !onErrorClick) return;

    const disposable = editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          const matchingError = errors.find((err) => err.line === lineNumber);
          if (matchingError) {
            onErrorClick(matchingError);
          }
        }
      }
    });

    return () => disposable.dispose();
  }, [errors, onErrorClick]);

  return (
    <div className="editor-container">
      <MonacoEditor
        height="100%"
        defaultLanguage={LANGUAGE_ID}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          minimap: {
            enabled: true,
            scale: 2,
          },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          padding: {
            top: 12,
            bottom: 12,
          },
          // Enable quick suggestions and code actions
          quickSuggestions: true,
          lightbulb: {
            enabled: 'on' as Monaco.editor.ShowLightbulbIconMode,
          },
        }}
        loading={
          <div className="loading">
            <div className="loading-spinner" />
            Loading editor...
          </div>
        }
      />
    </div>
  );
}

/**
 * Monaco Editor Component for Cell Diagrams
 */

import { useRef, useCallback } from 'react';
import MonacoEditor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { LANGUAGE_ID, registerCellDiagramsLanguage } from '../monaco';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: Array<{
    message: string;
    line: number;
    column: number;
  }>;
}

export function Editor({ value, onChange, errors = [] }: EditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

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

    // Focus editor
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update error markers when errors change
  const updateMarkers = useCallback(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    if (!monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    const markers: Monaco.editor.IMarkerData[] = errors.map((error) => ({
      severity: monaco.MarkerSeverity.Error,
      message: error.message,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
    }));

    monaco.editor.setModelMarkers(model, 'cell-diagrams', markers);
  }, [errors]);

  // Update markers when errors change
  if (monacoRef.current && editorRef.current) {
    updateMarkers();
  }

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

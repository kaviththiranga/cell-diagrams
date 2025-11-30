/**
 * Cell Diagrams Web Application
 */

import { useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header, Editor, Preview, StatusBar } from './components';
import { useDiagramState } from './hooks';
import { defaultSampleCode } from './monaco';

export function App() {
  const { source, setSource, errors, stats } = useDiagramState(defaultSampleCode);

  const handleReset = useCallback(() => {
    setSource(defaultSampleCode);
  }, [setSource]);

  return (
    <div className="app">
      <Header onReset={handleReset} />

      <main className="app-main">
        <PanelGroup direction="horizontal">
          {/* Editor Panel */}
          <Panel defaultSize={45} minSize={25}>
            <div className="panel editor-panel">
              <div className="panel-header">
                <span className="panel-title">Editor</span>
                {errors.length > 0 && (
                  <div className="error-indicator">
                    {errors.length} error{errors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="panel-content">
                <Editor
                  value={source}
                  onChange={setSource}
                  errors={errors}
                />
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="resize-handle" />

          {/* Preview Panel */}
          <Panel defaultSize={55} minSize={30}>
            <div className="panel preview-panel">
              <div className="panel-header">
                <span className="panel-title">Diagram Preview</span>
              </div>
              <div className="panel-content">
                <Preview source={source} />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </main>

      <StatusBar
        errorCount={errors.length}
        nodeCount={stats.nodeCount}
        edgeCount={stats.edgeCount}
      />
    </div>
  );
}

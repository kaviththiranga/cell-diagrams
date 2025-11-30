/**
 * Diagram Preview Component
 */

import { CellDiagram } from '@cell-diagrams/renderer';
import '@cell-diagrams/renderer/styles.css';

interface PreviewProps {
  source: string;
}

export function Preview({ source }: PreviewProps) {
  if (!source.trim()) {
    return (
      <div className="empty-state">
        <svg
          className="empty-state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <line x1="10" y1="6.5" x2="14" y2="6.5" />
          <line x1="6.5" y1="10" x2="6.5" y2="14" />
          <line x1="17.5" y1="10" x2="17.5" y2="14" />
          <line x1="10" y1="17.5" x2="14" y2="17.5" />
        </svg>
        <div className="empty-state-title">No Diagram</div>
        <div className="empty-state-description">
          Enter Cell Diagrams DSL code in the editor to see your architecture diagram here.
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container">
      <CellDiagram
        source={source}
        fitView={true}
        layoutOptions={{
          direction: 'TB',
          nodeSpacingX: 120,
          nodeSpacingY: 100,
          padding: 50,
        }}
      />
    </div>
  );
}

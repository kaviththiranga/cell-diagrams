/**
 * Status Bar Component
 */

interface StatusBarProps {
  errorCount: number;
  nodeCount: number;
  edgeCount: number;
}

export function StatusBar({ errorCount, nodeCount, edgeCount }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {errorCount > 0 ? (
          <span className="status-item error">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="status-item success">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            No errors
          </span>
        )}
      </div>
      <div className="status-bar-right">
        <span className="status-item">
          {nodeCount} node{nodeCount !== 1 ? 's' : ''}
        </span>
        <span className="status-item">
          {edgeCount} connection{edgeCount !== 1 ? 's' : ''}
        </span>
        <span className="status-item">Cell Diagrams DSL</span>
      </div>
    </div>
  );
}

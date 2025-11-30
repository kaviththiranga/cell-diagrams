/**
 * App Header Component
 */

interface HeaderProps {
  onReset?: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-logo">
          <svg viewBox="0 0 100 100">
            <rect width="100" height="100" rx="10" fill="white" fillOpacity="0.1" />
            <rect x="15" y="15" width="30" height="30" rx="5" fill="white" fillOpacity="0.9" />
            <rect x="55" y="15" width="30" height="30" rx="5" fill="white" fillOpacity="0.7" />
            <rect x="15" y="55" width="30" height="30" rx="5" fill="white" fillOpacity="0.7" />
            <rect x="55" y="55" width="30" height="30" rx="5" fill="white" fillOpacity="0.9" />
            <line x1="45" y1="30" x2="55" y2="30" stroke="white" strokeWidth="3" />
            <line x1="30" y1="45" x2="30" y2="55" stroke="white" strokeWidth="3" />
            <line x1="70" y1="45" x2="70" y2="55" stroke="white" strokeWidth="3" />
            <line x1="45" y1="70" x2="55" y2="70" stroke="white" strokeWidth="3" />
          </svg>
          Cell Diagrams
        </div>
      </div>
      <div className="app-header-right">
        <button className="header-button" onClick={onReset} title="Reset to example">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset
        </button>
        <a
          href="https://github.com/your-org/cell-diagrams"
          target="_blank"
          rel="noopener noreferrer"
          className="header-button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}

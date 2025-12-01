/**
 * ErrorPanel Component
 *
 * Displays parse errors grouped by category with severity indicators.
 * Supports click-to-navigate and shows recovery hints.
 */

import { memo, useState, useCallback } from 'react';
import type { EnhancedParseError, ErrorCategory, ErrorSeverity } from '@cell-diagrams/core';
import { getCategoryDisplayName, getSeverityColor } from '../hooks/useCellDiagram';

export interface ErrorPanelProps {
  /** List of errors to display */
  errors: EnhancedParseError[];
  /** Errors grouped by category */
  errorsByCategory?: Map<ErrorCategory, EnhancedParseError[]> | undefined;
  /** Error counts by severity */
  errorCounts?: {
    error: number;
    warning: number;
    info: number;
    total: number;
  } | undefined;
  /** Callback when an error is clicked */
  onErrorClick?: ((error: EnhancedParseError) => void) | undefined;
  /** Callback to apply a suggested fix */
  onApplyFix?: ((error: EnhancedParseError) => void) | undefined;
  /** Whether the panel is collapsible */
  collapsible?: boolean | undefined;
  /** Initial collapsed state */
  defaultCollapsed?: boolean | undefined;
  /** Position of the panel */
  position?: 'bottom' | 'right' | 'overlay' | undefined;
  /** Additional class name */
  className?: string | undefined;
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'error':
      return ''; // X in circle
    case 'warning':
      return ''; // Warning triangle
    case 'info':
      return ''; // Info circle
    default:
      return '';
  }
}

/**
 * Individual error item component
 */
const ErrorItem = memo(function ErrorItem({
  error,
  onClick,
  onApplyFix,
}: {
  error: EnhancedParseError;
  onClick?: ((error: EnhancedParseError) => void) | undefined;
  onApplyFix?: ((error: EnhancedParseError) => void) | undefined;
}) {
  const handleClick = useCallback(() => {
    onClick?.(error);
  }, [error, onClick]);

  const handleApplyFix = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onApplyFix?.(error);
    },
    [error, onApplyFix]
  );

  return (
    <div
      className={`error-panel-item error-panel-item--${error.severity}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="error-panel-item-header">
        <span
          className="error-panel-item-icon"
          style={{ color: getSeverityColor(error.severity) }}
        >
          {getSeverityIcon(error.severity)}
        </span>
        <span className="error-panel-item-location">
          {error.line}:{error.column}
        </span>
        {error.code && (
          <span className="error-panel-item-code">E{error.code}</span>
        )}
      </div>

      <div className="error-panel-item-message">{error.message}</div>

      {error.recoveryHint && (
        <div className="error-panel-item-hint">
          <span className="error-panel-hint-icon"></span>
          {error.recoveryHint}
        </div>
      )}

      {error.suggestedFix && onApplyFix && (
        <button
          className="error-panel-item-fix-btn"
          onClick={handleApplyFix}
          title={error.suggestedFix.description}
        >
          <span className="fix-icon"></span>
          {error.suggestedFix.description}
        </button>
      )}

      {error.expectedTokens && error.expectedTokens.length > 0 && (
        <div className="error-panel-item-expected">
          Expected: {error.expectedTokens.slice(0, 3).join(', ')}
          {error.expectedTokens.length > 3 && ` (+${error.expectedTokens.length - 3} more)`}
        </div>
      )}
    </div>
  );
});

/**
 * Category group component
 */
const CategoryGroup = memo(function CategoryGroup({
  category,
  errors,
  onErrorClick,
  onApplyFix,
}: {
  category: ErrorCategory;
  errors: EnhancedParseError[];
  onErrorClick?: ((error: EnhancedParseError) => void) | undefined;
  onApplyFix?: ((error: EnhancedParseError) => void) | undefined;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="error-panel-category">
      <button
        className="error-panel-category-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`error-panel-category-chevron ${expanded ? 'expanded' : ''}`}>

        </span>
        <span className="error-panel-category-name">
          {getCategoryDisplayName(category)}
        </span>
        <span className="error-panel-category-count">{errors.length}</span>
      </button>

      {expanded && (
        <div className="error-panel-category-items">
          {errors.map((error, idx) => (
            <ErrorItem
              key={`${error.line}-${error.column}-${idx}`}
              error={error}
              onClick={onErrorClick}
              onApplyFix={onApplyFix}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * ErrorPanel - Main component for displaying parse errors
 */
export const ErrorPanel = memo(function ErrorPanel({
  errors,
  errorsByCategory,
  errorCounts,
  onErrorClick,
  onApplyFix,
  collapsible = true,
  defaultCollapsed = false,
  position = 'bottom',
  className = '',
}: ErrorPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Build category map if not provided
  const categoryMap = errorsByCategory ?? (() => {
    const map = new Map<ErrorCategory, EnhancedParseError[]>();
    for (const error of errors) {
      const existing = map.get(error.category) ?? [];
      existing.push(error);
      map.set(error.category, existing);
    }
    return map;
  })();

  // Calculate counts if not provided
  const counts = errorCounts ?? {
    error: errors.filter((e) => e.severity === 'error').length,
    warning: errors.filter((e) => e.severity === 'warning').length,
    info: errors.filter((e) => e.severity === 'info').length,
    total: errors.length,
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`error-panel error-panel--${position} ${className}`}>
      {/* Header */}
      <div className="error-panel-header">
        <div className="error-panel-title">
          <span className="error-panel-title-icon"></span>
          Problems
          <span className="error-panel-total-count">{counts.total}</span>
        </div>

        <div className="error-panel-counts">
          {counts.error > 0 && (
            <span className="error-panel-count error-panel-count--error">
               {counts.error}
            </span>
          )}
          {counts.warning > 0 && (
            <span className="error-panel-count error-panel-count--warning">
               {counts.warning}
            </span>
          )}
          {counts.info > 0 && (
            <span className="error-panel-count error-panel-count--info">
               {counts.info}
            </span>
          )}
        </div>

        {collapsible && (
          <button
            className="error-panel-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '' : ''}
          </button>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="error-panel-content">
          {/* Category groups */}
          {Array.from(categoryMap.entries())
            .sort(([a], [b]) => {
              // Sort by importance: lexical, syntactic, structural, semantic
              const order: ErrorCategory[] = ['lexical', 'syntactic', 'structural', 'semantic'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([category, categoryErrors]) => (
              <CategoryGroup
                key={category}
                category={category}
                errors={categoryErrors}
                onErrorClick={onErrorClick}
                onApplyFix={onApplyFix}
              />
            ))}
        </div>
      )}
    </div>
  );
});

export default ErrorPanel;

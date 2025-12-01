/**
 * CellNode Component - Minimalist Excalidraw-style
 *
 * Renders a regular octagonal cell boundary with label.
 * Components are rendered as separate nodes inside.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type {
  CellNode as CellNodeType,
  CellNodeData,
} from '../types';

/**
 * Generate SVG path for a regular octagon with equal sides.
 * The octagon is sized to fit within the given width/height while
 * maintaining equal side lengths.
 */
function generateRegularOctagonPath(width: number, height: number): string {
  // For a regular octagon, we need all 8 sides to be equal length.
  // The relationship is: if the corner cut is 'c', the diagonal side = c * √2
  // For equal sides: horizontal/vertical side = diagonal side
  // So: (width - 2c) = c * √2, solving for c: c = width / (2 + √2)

  const sqrt2 = Math.SQRT2;
  const size = Math.min(width, height);

  // Calculate corner cut for regular octagon
  const c = size / (2 + sqrt2);

  // Center the octagon in the available space
  const offsetX = (width - size) / 2;
  const offsetY = (height - size) / 2;

  // Calculate the 8 vertices of a regular octagon, starting from top-left going clockwise
  const points: [number, number][] = [
    [offsetX + c, offsetY],                           // Top-left corner (end of top edge)
    [offsetX + size - c, offsetY],                    // Top-right corner (start of top edge)
    [offsetX + size, offsetY + c],                    // Right-top corner
    [offsetX + size, offsetY + size - c],             // Right-bottom corner
    [offsetX + size - c, offsetY + size],             // Bottom-right corner
    [offsetX + c, offsetY + size],                    // Bottom-left corner
    [offsetX, offsetY + size - c],                    // Left-bottom corner
    [offsetX, offsetY + c],                           // Left-top corner
  ];

  // Build SVG path
  const path = points.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  ).join(' ');

  return path + ' Z';
}

function CellNodeComponent({ data, selected }: NodeProps<CellNodeType>) {
  const cellData = data as CellNodeData;

  const width = cellData.width ?? 400;
  const height = cellData.height ?? 300;
  const hasErrors = cellData.hasErrors ?? false;
  const errorCount = cellData.errorCount ?? 0;

  // Generate regular octagon path with equal sides
  const octagonPath = generateRegularOctagonPath(width, height);

  // Determine stroke color based on error state
  const strokeColor = hasErrors ? '#dc2626' : '#868e96';
  const strokeDasharray = hasErrors ? '8 4' : 'none';

  return (
    <div
      className={`cell-boundary-node ${selected ? 'selected' : ''} ${hasErrors ? 'has-errors' : ''}`}
      style={{ width, height }}
    >
      {/* Error badge */}
      {hasErrors && errorCount > 0 && (
        <div className="cell-error-badge">
          {errorCount} error{errorCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Connection handles for all four directions */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="cell-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="cell-handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="cell-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="cell-handle"
      />

      {/* SVG Octagon boundary */}
      <svg
        className="cell-boundary-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          d={octagonPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          className="cell-boundary-path"
        />
      </svg>

      {/* Cell label at bottom */}
      <div className="cell-boundary-label">
        Cell: {cellData.label}
      </div>
    </div>
  );
}

export const CellNode = memo(CellNodeComponent);

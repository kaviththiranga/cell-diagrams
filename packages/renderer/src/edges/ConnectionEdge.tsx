/**
 * ConnectionEdge Component
 *
 * Custom edge for rendering connections between cells.
 * Supports both bezier (curvy) and smoothstep (orthogonal) paths.
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { DiagramEdge, ConnectionEdgeData } from '../types';

function ConnectionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<DiagramEdge>) {
  const edgeData = data as ConnectionEdgeData | undefined;
  const label = edgeData?.label;
  const useStepPath = edgeData?.edgeStyle === 'step';

  // Use step path for inter-cell connections, bezier for others
  const [edgePath, labelX, labelY] = useStepPath
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...(markerEnd !== undefined && { markerEnd })}
        className={`connection-edge ${selected ? 'selected' : ''}`}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="connection-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ConnectionEdge = memo(ConnectionEdgeComponent);

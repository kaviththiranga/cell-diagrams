/**
 * InterCellEdge Component
 *
 * Custom edge for rendering inter-cell connections that routes around component nodes.
 * Uses bezier curves with waypoints to avoid passing through components.
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';
import type { DiagramEdge, ConnectionEdgeData } from '../types';

function InterCellEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
  markerEnd,
}: EdgeProps<DiagramEdge>) {
  // Calculate a curved path that routes around component nodes
  // For inter-cell connections, we want to create an arc that goes above/below
  // the direct line to avoid passing through components
  
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate offset based on distance - larger offset for longer connections
  // This creates an arc that goes around nodes
  const offset = Math.max(80, distance * 0.25); // Minimum 80px, or 25% of distance
  
  // Determine if connection is primarily horizontal or vertical
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  let controlPoint1X: number;
  let controlPoint1Y: number;
  let controlPoint2X: number;
  let controlPoint2Y: number;
  
  if (isHorizontal) {
    // Horizontal connection: create vertical arc to go above components
    // Use a single cubic bezier with control points that create an upward arc
    const minY = Math.min(sourceY, targetY);
    
    // Control points create an arc above the direct line
    controlPoint1X = sourceX + dx * 0.25;
    controlPoint1Y = minY - offset;
    controlPoint2X = sourceX + dx * 0.75;
    controlPoint2Y = minY - offset;
  } else {
    // Vertical connection: create horizontal arc to go around components
    const minX = Math.min(sourceX, targetX);
    
    // Control points create an arc to the side
    controlPoint1X = minX - offset;
    controlPoint1Y = sourceY + dy * 0.25;
    controlPoint2X = minX - offset;
    controlPoint2Y = sourceY + dy * 0.75;
  }
  
  // Create cubic bezier path
  const edgePath = `M ${sourceX},${sourceY} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;
  
  // Label position at midpoint of the arc
  const labelX = (sourceX + targetX) / 2;
  const labelY = isHorizontal 
    ? Math.min(sourceY, targetY) - offset
    : (sourceY + targetY) / 2;

  const edgeData = data as ConnectionEdgeData | undefined;
  const label = edgeData?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        {...(markerEnd !== undefined && { markerEnd })}
        className={`inter-cell-edge ${selected ? 'selected' : ''}`}
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

export const InterCellEdge = memo(InterCellEdgeComponent);


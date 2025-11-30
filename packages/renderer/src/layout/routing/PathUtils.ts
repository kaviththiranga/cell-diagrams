/**
 * Path Utilities
 *
 * Helper functions for SVG path generation and manipulation.
 */

import type { Position, PortAlignment, BoundingBox } from '../types';

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Position, p2: Position): Position {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate angle between two points (in radians)
 */
export function angle(p1: Position, p2: Position): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Get port position on a node boundary
 */
export function getPortPosition(
  nodePosition: Position,
  nodeWidth: number,
  nodeHeight: number,
  alignment: PortAlignment
): Position {
  switch (alignment) {
    case 'top':
      return {
        x: nodePosition.x + nodeWidth / 2,
        y: nodePosition.y,
      };
    case 'bottom':
      return {
        x: nodePosition.x + nodeWidth / 2,
        y: nodePosition.y + nodeHeight,
      };
    case 'left':
      return {
        x: nodePosition.x,
        y: nodePosition.y + nodeHeight / 2,
      };
    case 'right':
      return {
        x: nodePosition.x + nodeWidth,
        y: nodePosition.y + nodeHeight / 2,
      };
    default:
      return {
        x: nodePosition.x + nodeWidth / 2,
        y: nodePosition.y + nodeHeight / 2,
      };
  }
}

/**
 * Determine best port alignment for connecting two nodes
 */
export function getBestPortAlignment(
  sourcePos: Position,
  sourceWidth: number,
  sourceHeight: number,
  targetPos: Position,
  targetWidth: number,
  targetHeight: number
): { source: PortAlignment; target: PortAlignment } {
  const sourceCenter = {
    x: sourcePos.x + sourceWidth / 2,
    y: sourcePos.y + sourceHeight / 2,
  };
  const targetCenter = {
    x: targetPos.x + targetWidth / 2,
    y: targetPos.y + targetHeight / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      return { source: 'right', target: 'left' };
    } else {
      return { source: 'left', target: 'right' };
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      return { source: 'bottom', target: 'top' };
    } else {
      return { source: 'top', target: 'bottom' };
    }
  }
}

/**
 * Check if a point is inside a bounding box
 */
export function isPointInBounds(point: Position, bounds: BoundingBox): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

/**
 * Check if a line segment intersects a bounding box
 */
export function lineIntersectsBounds(
  p1: Position,
  p2: Position,
  bounds: BoundingBox
): boolean {
  // Check if either endpoint is inside
  if (isPointInBounds(p1, bounds) || isPointInBounds(p2, bounds)) {
    return true;
  }

  // Check line intersection with each edge
  const edges: [Position, Position][] = [
    [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY }], // Top
    [{ x: bounds.maxX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }], // Right
    [{ x: bounds.minX, y: bounds.maxY }, { x: bounds.maxX, y: bounds.maxY }], // Bottom
    [{ x: bounds.minX, y: bounds.minY }, { x: bounds.minX, y: bounds.maxY }], // Left
  ];

  return edges.some(([e1, e2]) => lineSegmentsIntersect(p1, p2, e1, e2));
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(
  p1: Position,
  p2: Position,
  p3: Position,
  p4: Position
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

/**
 * Calculate cross product direction
 */
function direction(p1: Position, p2: Position, p3: Position): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

/**
 * Check if point is on segment
 */
function onSegment(p1: Position, p2: Position, p3: Position): boolean {
  return (
    Math.min(p1.x, p2.x) <= p3.x &&
    p3.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p3.y &&
    p3.y <= Math.max(p1.y, p2.y)
  );
}

/**
 * Generate SVG arc command
 */
export function arcTo(
  endPoint: Position,
  radius: number,
  sweepFlag: 0 | 1 = 1,
  largeArcFlag: 0 | 1 = 0
): string {
  return `A ${radius},${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x},${endPoint.y}`;
}

/**
 * Generate SVG line command
 */
export function lineTo(point: Position): string {
  return `L ${point.x} ${point.y}`;
}

/**
 * Generate SVG move command
 */
export function moveTo(point: Position): string {
  return `M ${point.x} ${point.y}`;
}

/**
 * Generate SVG quadratic bezier command
 */
export function quadraticTo(control: Position, end: Position): string {
  return `Q ${control.x} ${control.y}, ${end.x} ${end.y}`;
}

/**
 * Generate SVG cubic bezier command
 */
export function cubicTo(
  control1: Position,
  control2: Position,
  end: Position
): string {
  return `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
}

/**
 * Offset a path by moving control points
 */
export function offsetPath(
  path: string,
  offsetX: number,
  offsetY: number
): string {
  // Simple regex-based path offsetting
  return path.replace(
    /(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g,
    (_, x, y) => `${parseFloat(x) + offsetX} ${parseFloat(y) + offsetY}`
  );
}

/**
 * Calculate path length (approximate for bezier curves)
 */
export function approximatePathLength(points: Position[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      length += distance(prev, curr);
    }
  }
  return length;
}

/**
 * Interpolate position along a line
 */
export function interpolate(p1: Position, p2: Position, t: number): Position {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

/**
 * Create arrow marker path
 */
export function createArrowPath(
  tip: Position,
  direction: number,
  size: number = 10
): string {
  const angle1 = direction + Math.PI * 0.8;
  const angle2 = direction - Math.PI * 0.8;

  const p1 = {
    x: tip.x + Math.cos(angle1) * size,
    y: tip.y + Math.sin(angle1) * size,
  };

  const p2 = {
    x: tip.x + Math.cos(angle2) * size,
    y: tip.y + Math.sin(angle2) * size,
  };

  return `M ${p1.x} ${p1.y} L ${tip.x} ${tip.y} L ${p2.x} ${p2.y}`;
}

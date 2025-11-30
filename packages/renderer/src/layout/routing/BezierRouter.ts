/**
 * Bezier Edge Router
 *
 * Generates smooth bezier curve paths for edges with intelligent
 * straight-line detection and arc-based routing.
 *
 * Based on: cell-diagram/src/components/Project/AdvancedLink/AdvancedLinkModel.ts (lines 74-186)
 */

import type { Position, PortAlignment, IEdgeRouter } from '../types';

export interface BezierRouterOptions {
  /** Tolerance for straight line detection */
  straightLineTolerance: number;
  /** Default curve offset for arcs */
  curveOffset: number;
  /** Minimum curve radius */
  minCurveRadius: number;
  /** Extra horizontal offset for link paths */
  linkXOffset: number;
}

const DEFAULT_BEZIER_OPTIONS: BezierRouterOptions = {
  straightLineTolerance: 4,
  curveOffset: 10,
  minCurveRadius: 5,
  linkXOffset: 50,
};

/**
 * Routes edges using bezier curves with intelligent path generation
 */
export class BezierRouter implements IEdgeRouter {
  private options: BezierRouterOptions;

  constructor(options: Partial<BezierRouterOptions> = {}) {
    this.options = { ...DEFAULT_BEZIER_OPTIONS, ...options };
  }

  /**
   * Route an edge between two positions
   *
   * @param source Source position
   * @param target Target position
   * @param options Port alignment options
   * @returns SVG path string
   */
  route(
    source: Position,
    target: Position,
    options?: {
      sourcePort?: PortAlignment;
      targetPort?: PortAlignment;
    }
  ): string {
    // Check for straight line
    if (this.isStraight(source, target)) {
      return this.generateStraightPath(source, target);
    }

    // Generate curved path based on port alignments
    if (options?.sourcePort || options?.targetPort) {
      return this.generatePortAwarePath(source, target, options);
    }

    return this.generateCurvedPath(source, target);
  }

  /**
   * Check if line between two points is straight (within tolerance)
   */
  isStraight(source: Position, target: Position): boolean {
    const { straightLineTolerance } = this.options;
    return (
      Math.abs(source.y - target.y) <= straightLineTolerance ||
      Math.abs(source.x - target.x) <= straightLineTolerance
    );
  }

  /**
   * Generate a straight line path
   */
  generateStraightPath(source: Position, target: Position): string {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  /**
   * Generate a curved path using bezier curves
   */
  generateCurvedPath(source: Position, target: Position): string {
    const { curveOffset, linkXOffset } = this.options;

    // Calculate curve parameters
    const deltaY = Math.abs(source.y - target.y);
    const actualCurveOffset = Math.min(curveOffset, deltaY / 2);

    // Calculate midpoint
    const rawMidX = (source.x + target.x) / 2;
    const midX =
      Math.abs(rawMidX) > Math.abs(source.x + linkXOffset)
        ? rawMidX
        : source.x + linkXOffset;

    const isRight = source.x < target.x;
    const isBottom = source.y < target.y;

    let path = `M ${source.x} ${source.y} `;

    // Horizontal line to before midpoint
    path += `L ${midX - actualCurveOffset} ${source.y} `;

    // Generate curves based on direction
    if (isRight) {
      if (isBottom) {
        // Right-down: curve down at midpoint
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 1 ${midX},${source.y + actualCurveOffset} `;
        path += `L ${midX} ${target.y - actualCurveOffset} `;
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 0 ${midX + actualCurveOffset},${target.y} `;
      } else {
        // Right-up: curve up at midpoint
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 0 ${midX},${source.y - actualCurveOffset} `;
        path += `L ${midX} ${target.y + actualCurveOffset} `;
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 1 ${midX + actualCurveOffset},${target.y} `;
      }
    } else {
      if (isBottom) {
        // Left-down: curve down at midpoint
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 0 ${midX},${source.y + actualCurveOffset} `;
        path += `L ${midX} ${target.y - actualCurveOffset} `;
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 1 ${midX - actualCurveOffset},${target.y} `;
      } else {
        // Left-up: curve up at midpoint
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 1 ${midX},${source.y - actualCurveOffset} `;
        path += `L ${midX} ${target.y + actualCurveOffset} `;
        path += `A ${actualCurveOffset},${actualCurveOffset} 0 0 0 ${midX - actualCurveOffset},${target.y} `;
      }
    }

    // Final horizontal line to target
    path += `L ${target.x} ${target.y}`;

    return path;
  }

  /**
   * Generate path aware of port alignments
   */
  generatePortAwarePath(
    source: Position,
    target: Position,
    options: {
      sourcePort?: PortAlignment;
      targetPort?: PortAlignment;
    }
  ): string {
    const { curveOffset } = this.options;
    const sourcePort = options.sourcePort || 'right';
    const targetPort = options.targetPort || 'left';

    // Calculate control points based on ports
    const controlOffset = Math.min(
      curveOffset * 5,
      Math.abs(target.x - source.x) / 2,
      Math.abs(target.y - source.y) / 2 || curveOffset * 5
    );

    let sourceControl: Position;
    let targetControl: Position;

    // Source control point based on port
    switch (sourcePort) {
      case 'top':
        sourceControl = { x: source.x, y: source.y - controlOffset };
        break;
      case 'bottom':
        sourceControl = { x: source.x, y: source.y + controlOffset };
        break;
      case 'left':
        sourceControl = { x: source.x - controlOffset, y: source.y };
        break;
      case 'right':
      default:
        sourceControl = { x: source.x + controlOffset, y: source.y };
        break;
    }

    // Target control point based on port
    switch (targetPort) {
      case 'top':
        targetControl = { x: target.x, y: target.y - controlOffset };
        break;
      case 'bottom':
        targetControl = { x: target.x, y: target.y + controlOffset };
        break;
      case 'right':
        targetControl = { x: target.x + controlOffset, y: target.y };
        break;
      case 'left':
      default:
        targetControl = { x: target.x - controlOffset, y: target.y };
        break;
    }

    // Generate cubic bezier path
    return `M ${source.x} ${source.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${target.x} ${target.y}`;
  }

  /**
   * Generate a simple quadratic bezier curve
   */
  generateQuadraticPath(source: Position, target: Position): string {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;

    // Offset control point perpendicular to line
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const offsetAmount = Math.min(dist * 0.2, 50);
    const controlX = midX - (dy / dist) * offsetAmount;
    const controlY = midY + (dx / dist) * offsetAmount;

    return `M ${source.x} ${source.y} Q ${controlX} ${controlY}, ${target.x} ${target.y}`;
  }

  /**
   * Generate smooth step path (orthogonal with rounded corners)
   */
  generateSmoothStepPath(source: Position, target: Position): string {
    const { curveOffset } = this.options;
    const midX = (source.x + target.x) / 2;

    const radius = Math.min(
      curveOffset,
      Math.abs(midX - source.x) / 2,
      Math.abs(target.y - source.y) / 2
    );

    if (radius < 1) {
      return this.generateStraightPath(source, target);
    }

    const isRight = source.x < target.x;
    const isDown = source.y < target.y;

    let path = `M ${source.x} ${source.y} `;

    // First horizontal segment
    path += `L ${midX - radius} ${source.y} `;

    // First corner
    if (isDown) {
      path += `Q ${midX} ${source.y}, ${midX} ${source.y + radius} `;
    } else {
      path += `Q ${midX} ${source.y}, ${midX} ${source.y - radius} `;
    }

    // Vertical segment
    if (isDown) {
      path += `L ${midX} ${target.y - radius} `;
    } else {
      path += `L ${midX} ${target.y + radius} `;
    }

    // Second corner
    if (isRight) {
      path += `Q ${midX} ${target.y}, ${midX + radius} ${target.y} `;
    } else {
      path += `Q ${midX} ${target.y}, ${midX - radius} ${target.y} `;
    }

    // Final horizontal segment
    path += `L ${target.x} ${target.y}`;

    return path;
  }

  /**
   * Configure options
   */
  configure(options: Partial<BezierRouterOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

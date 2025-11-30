/**
 * Overlap Resolver
 *
 * Detects and resolves overlapping nodes using grid fallback.
 * Overlapping nodes are moved to a clean grid layout below the main layout.
 *
 * Based on: cell-diagram conflict resolution patterns
 */

import type {
  Position,
  Dimensions,
  BoundingBox,
  LayoutNode,
  NodeOverlap,
} from '../types';
import { GridLayout } from '../algorithms/GridLayout';

export interface OverlapResolverOptions {
  /** Minimum padding between nodes */
  padding: number;
  /** Spacing in fallback grid */
  gridSpacing: number;
  /** Vertical offset between main layout and grid fallback */
  gridVerticalOffset: number;
}

const DEFAULT_OVERLAP_OPTIONS: OverlapResolverOptions = {
  padding: 20,
  gridSpacing: 100,
  gridVerticalOffset: 100,
};

/**
 * Resolves overlapping nodes by moving them to a grid layout
 */
export class OverlapResolver {
  private options: OverlapResolverOptions;
  private gridLayout: GridLayout;

  constructor(options: Partial<OverlapResolverOptions> = {}) {
    this.options = { ...DEFAULT_OVERLAP_OPTIONS, ...options };
    this.gridLayout = new GridLayout({
      spacing: this.options.gridSpacing,
    });
  }

  /**
   * Resolve overlaps in node positions
   *
   * @param positions Current node positions
   * @param nodes Node data with dimensions
   * @returns Adjusted positions with overlaps resolved
   */
  resolve(
    positions: Map<string, Position>,
    nodes: LayoutNode[]
  ): Map<string, Position> {
    const dimensions = this.buildDimensionsMap(nodes);
    const overlaps = this.detectOverlaps(positions, dimensions);

    if (overlaps.length === 0) {
      return positions;
    }

    return this.resolveWithGridFallback(positions, nodes, overlaps);
  }

  /**
   * Detect all overlapping node pairs
   */
  detectOverlaps(
    positions: Map<string, Position>,
    dimensions: Map<string, Dimensions>
  ): NodeOverlap[] {
    const overlaps: NodeOverlap[] = [];
    const entries = Array.from(positions.entries());
    const { padding } = this.options;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entryA = entries[i]!;
        const entryB = entries[j]!;
        const [idA, posA] = entryA;
        const [idB, posB] = entryB;

        const dimA = dimensions.get(idA) || { width: 80, height: 80 };
        const dimB = dimensions.get(idB) || { width: 80, height: 80 };

        const overlapArea = this.calculateOverlapArea(
          posA,
          dimA,
          posB,
          dimB,
          padding
        );

        if (overlapArea > 0) {
          overlaps.push({
            nodeA: idA,
            nodeB: idB,
            overlapArea,
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Check if two nodes overlap
   */
  isOverlapping(
    posA: Position,
    dimA: Dimensions,
    posB: Position,
    dimB: Dimensions,
    padding: number = 0
  ): boolean {
    return !(
      posA.x + dimA.width + padding < posB.x ||
      posB.x + dimB.width + padding < posA.x ||
      posA.y + dimA.height + padding < posB.y ||
      posB.y + dimB.height + padding < posA.y
    );
  }

  /**
   * Calculate overlap area between two nodes
   */
  calculateOverlapArea(
    posA: Position,
    dimA: Dimensions,
    posB: Position,
    dimB: Dimensions,
    padding: number = 0
  ): number {
    const overlapX = Math.max(
      0,
      Math.min(posA.x + dimA.width + padding, posB.x + dimB.width + padding) -
        Math.max(posA.x, posB.x)
    );

    const overlapY = Math.max(
      0,
      Math.min(posA.y + dimA.height + padding, posB.y + dimB.height + padding) -
        Math.max(posA.y, posB.y)
    );

    return overlapX * overlapY;
  }

  /**
   * Resolve overlaps by moving overlapping nodes to a grid
   */
  private resolveWithGridFallback(
    positions: Map<string, Position>,
    nodes: LayoutNode[],
    overlaps: NodeOverlap[]
  ): Map<string, Position> {
    // Collect all overlapping node IDs
    const overlappingIds = new Set<string>();
    overlaps.forEach(({ nodeA, nodeB }) => {
      overlappingIds.add(nodeA);
      overlappingIds.add(nodeB);
    });

    // Separate non-overlapping and overlapping positions
    const nonOverlapping = new Map<string, Position>();
    const overlappingNodes: LayoutNode[] = [];

    positions.forEach((pos, id) => {
      if (overlappingIds.has(id)) {
        const node = nodes.find((n) => n.id === id);
        if (node) {
          overlappingNodes.push(node);
        }
      } else {
        nonOverlapping.set(id, pos);
      }
    });

    // Get bounds of non-overlapping nodes
    const dimensions = this.buildDimensionsMap(nodes);
    const bounds = this.getBounds(nonOverlapping, dimensions);

    // Layout overlapping nodes in a grid below the main content
    const gridStartY = bounds.maxY + this.options.gridVerticalOffset;
    const gridStartX = bounds.minX;

    const gridPositions = this.gridLayout.layoutNodes(overlappingNodes, {
      spacing: this.options.gridSpacing,
      startX: gridStartX,
      startY: gridStartY,
      defaultNodeWidth: 80,
      defaultNodeHeight: 80,
    });

    // Merge results
    const result = new Map(nonOverlapping);
    gridPositions.forEach((pos, id) => result.set(id, pos));

    return result;
  }

  /**
   * Build dimensions map from nodes
   */
  private buildDimensionsMap(nodes: LayoutNode[]): Map<string, Dimensions> {
    const dimensions = new Map<string, Dimensions>();
    nodes.forEach((node) => {
      dimensions.set(node.id, {
        width: node.width,
        height: node.height,
      });
    });
    return dimensions;
  }

  /**
   * Get bounding box of positions
   */
  private getBounds(
    positions: Map<string, Position>,
    dimensions: Map<string, Dimensions>
  ): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    positions.forEach((pos, id) => {
      const dim = dimensions.get(id) || { width: 80, height: 80 };
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + dim.width);
      maxY = Math.max(maxY, pos.y + dim.height);
    });

    // Handle empty case
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Configure options
   */
  configure(options: Partial<OverlapResolverOptions>): void {
    this.options = { ...this.options, ...options };
    this.gridLayout.configure({ spacing: this.options.gridSpacing });
  }
}

/**
 * Grid Layout Algorithm
 *
 * Arranges nodes in a √n × √n grid pattern.
 * Used as fallback for unlinked nodes and overlap resolution.
 *
 * Based on: cell-diagram/src/resources/Dagre/DagreEngine.ts (lines 172-189)
 */

import type {
  LayoutNode,
  Position,
  BoundingBox,
  ILayoutAlgorithm,
  LayoutEdge,
  LayoutEngineOptions,
} from '../types';

export interface GridLayoutOptions {
  /** Spacing between nodes */
  spacing: number;
  /** Starting X position */
  startX: number;
  /** Starting Y position */
  startY: number;
  /** Default node width (used if node doesn't specify) */
  defaultNodeWidth: number;
  /** Default node height (used if node doesn't specify) */
  defaultNodeHeight: number;
  /** Maximum columns (optional, uses √n if not specified) */
  maxColumns?: number;
}

const DEFAULT_GRID_OPTIONS: GridLayoutOptions = {
  spacing: 100,
  startX: 0,
  startY: 0,
  defaultNodeWidth: 80,
  defaultNodeHeight: 80,
};

/**
 * Grid layout algorithm that arranges nodes in a square grid pattern
 */
export class GridLayout implements ILayoutAlgorithm {
  private options: GridLayoutOptions;

  constructor(options: Partial<GridLayoutOptions> = {}) {
    this.options = { ...DEFAULT_GRID_OPTIONS, ...options };
  }

  /**
   * Layout nodes in a grid pattern
   * Ignores edges since grid layout doesn't consider connections
   */
  layout(
    nodes: LayoutNode[],
    _edges: LayoutEdge[],
    engineOptions?: Partial<LayoutEngineOptions>
  ): Map<string, Position> {
    const options = {
      ...this.options,
      spacing: engineOptions?.gridSpacing ?? this.options.spacing,
    };

    return this.layoutNodes(nodes, options);
  }

  /**
   * Layout nodes with specific options
   */
  layoutNodes(
    nodes: LayoutNode[],
    options: Partial<GridLayoutOptions> = {}
  ): Map<string, Position> {
    const opts = { ...this.options, ...options };
    const { spacing, startX, startY, defaultNodeWidth, defaultNodeHeight, maxColumns } = opts;

    const positions = new Map<string, Position>();

    if (nodes.length === 0) {
      return positions;
    }

    // Calculate grid dimensions
    const gridSize = maxColumns ?? Math.ceil(Math.sqrt(nodes.length));

    // Calculate cell spacing based on largest node
    const maxNodeWidth = Math.max(
      ...nodes.map((n) => n.width || defaultNodeWidth)
    );
    const maxNodeHeight = Math.max(
      ...nodes.map((n) => n.height || defaultNodeHeight)
    );

    const cellWidth = maxNodeWidth + spacing;
    const cellHeight = maxNodeHeight + spacing;

    // Position each node in grid
    nodes.forEach((node, index) => {
      const col = index % gridSize;
      const row = Math.floor(index / gridSize);

      const nodeWidth = node.width || defaultNodeWidth;
      const nodeHeight = node.height || defaultNodeHeight;

      // Center node within its grid cell
      const cellCenterX = startX + col * cellWidth + cellWidth / 2;
      const cellCenterY = startY + row * cellHeight + cellHeight / 2;

      positions.set(node.id, {
        x: cellCenterX - nodeWidth / 2,
        y: cellCenterY - nodeHeight / 2,
      });
    });

    return positions;
  }

  /**
   * Get bounding box of laid out nodes
   */
  getBounds(
    positions: Map<string, Position>,
    nodes: LayoutNode[]
  ): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    positions.forEach((pos, id) => {
      const node = nodes.find((n) => n.id === id);
      const width = node?.width || this.options.defaultNodeWidth;
      const height = node?.height || this.options.defaultNodeHeight;

      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + width);
      maxY = Math.max(maxY, pos.y + height);
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
  configure(options: Partial<GridLayoutOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

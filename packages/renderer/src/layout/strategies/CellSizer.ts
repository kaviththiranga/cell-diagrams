/**
 * Cell Sizer
 *
 * Calculates dynamic cell dimensions based on component content.
 * Uses 1.5x padding multiplier for comfortable spacing.
 *
 * Based on: cell-diagram/src/utils/projectUtils.ts (lines 119-165)
 */

import type {
  Position,
  Dimensions,
  BoundingBox,
  CellDimensions,
  LayoutNode,
} from '../types';

export interface CellSizerOptions {
  /** Minimum cell size (width and height) */
  minCellSize: number;
  /** Padding multiplier applied to content size */
  paddingMultiplier: number;
  /** Minimum padding from cell edge to content */
  minPadding: number;
}

const DEFAULT_CELL_SIZER_OPTIONS: CellSizerOptions = {
  minCellSize: 300,
  paddingMultiplier: 1.5,
  minPadding: 60,
};

/**
 * Calculates cell dimensions based on content
 */
export class CellSizer {
  private options: CellSizerOptions;

  constructor(options: Partial<CellSizerOptions> = {}) {
    this.options = { ...DEFAULT_CELL_SIZER_OPTIONS, ...options };
  }

  /**
   * Calculate cell size based on component positions and dimensions
   *
   * @param componentPositions Map of component ID to position
   * @param componentDimensions Map of component ID to dimensions
   * @returns Cell dimensions with content offset
   */
  calculateSize(
    componentPositions: Map<string, Position>,
    componentDimensions: Map<string, Dimensions>
  ): CellDimensions {
    const { minCellSize, paddingMultiplier, minPadding } = this.options;

    // Get bounding box of all components
    const bounds = this.getBoundingBox(componentPositions, componentDimensions);

    // Calculate content dimensions
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    // Use the larger dimension for a square cell, or use minimum
    const layoutSize = Math.max(contentWidth, contentHeight, minCellSize);

    // Apply padding multiplier
    const cellSize = Math.max(
      layoutSize * paddingMultiplier,
      minCellSize
    );

    // Calculate offset to center content within cell
    const paddingX = Math.max((cellSize - contentWidth) / 2, minPadding);
    const paddingY = Math.max((cellSize - contentHeight) / 2, minPadding);

    return {
      width: cellSize,
      height: cellSize,
      contentOffset: {
        x: paddingX - bounds.minX,
        y: paddingY - bounds.minY,
      },
    };
  }

  /**
   * Calculate cell size from nodes directly
   */
  calculateSizeFromNodes(nodes: LayoutNode[]): CellDimensions {
    const positions = new Map<string, Position>();
    const dimensions = new Map<string, Dimensions>();

    nodes.forEach((node) => {
      positions.set(node.id, { x: 0, y: 0 });
      dimensions.set(node.id, {
        width: node.width,
        height: node.height,
      });
    });

    return this.calculateSize(positions, dimensions);
  }

  /**
   * Get bounding box of components
   */
  getBoundingBox(
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
   * Apply content offset to component positions
   * Centers components within the cell
   */
  applyContentOffset(
    positions: Map<string, Position>,
    offset: Position
  ): Map<string, Position> {
    const adjusted = new Map<string, Position>();

    positions.forEach((pos, id) => {
      adjusted.set(id, {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
      });
    });

    return adjusted;
  }

  /**
   * Resize cell while maintaining content center
   */
  resize(
    currentDimensions: CellDimensions,
    newSize: number
  ): CellDimensions {
    const currentContentWidth =
      currentDimensions.width - 2 * currentDimensions.contentOffset.x;
    const currentContentHeight =
      currentDimensions.height - 2 * currentDimensions.contentOffset.y;

    const newPaddingX = Math.max(
      (newSize - currentContentWidth) / 2,
      this.options.minPadding
    );
    const newPaddingY = Math.max(
      (newSize - currentContentHeight) / 2,
      this.options.minPadding
    );

    return {
      width: newSize,
      height: newSize,
      contentOffset: {
        x: newPaddingX,
        y: newPaddingY,
      },
    };
  }

  /**
   * Configure options
   */
  configure(options: Partial<CellSizerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

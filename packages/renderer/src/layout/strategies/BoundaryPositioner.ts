/**
 * Boundary Positioner
 *
 * Positions external nodes (users, externals) around cell boundaries
 * based on their connection direction (north, south, east, west).
 *
 * Based on: cell-diagram/src/utils/projectUtils.ts (lines 205-287)
 */

import type {
  Position,
  Dimensions,
  BoundingBox,
  CellBound,
  LayoutNode,
  LayoutEdge,
  ExternalLayoutData,
} from '../types';

export interface BoundaryPositionerOptions {
  /** Distance from cell boundary to external node */
  offset: number;
  /** Spacing between external nodes on the same boundary */
  spacing: number;
  /** Default width for external nodes */
  defaultNodeWidth: number;
  /** Default height for external nodes */
  defaultNodeHeight: number;
}

const DEFAULT_BOUNDARY_OPTIONS: BoundaryPositionerOptions = {
  offset: 150,
  spacing: 50,
  defaultNodeWidth: 80,
  defaultNodeHeight: 80,
};

/** Cell bounds information */
export interface CellBounds extends Position, Dimensions {
  id: string;
}

/**
 * Positions external nodes around cell boundaries
 */
export class BoundaryPositioner {
  private options: BoundaryPositionerOptions;

  constructor(options: Partial<BoundaryPositionerOptions> = {}) {
    this.options = { ...DEFAULT_BOUNDARY_OPTIONS, ...options };
  }

  /**
   * Position external nodes around cells
   *
   * @param externals External nodes to position
   * @param cellBounds Bounds of all cells
   * @param connections Connections to determine which boundary
   * @returns Positioned external nodes
   */
  positionExternals(
    externals: ExternalLayoutData[],
    cellBounds: CellBounds[],
    connections: LayoutEdge[]
  ): Map<string, Position> {
    const positions = new Map<string, Position>();

    // Group externals by their target cell and boundary
    const grouped = this.groupByBoundary(externals, connections, cellBounds);

    // Position each group
    grouped.forEach((nodes, key) => {
      const [cellId, bound] = key.split(':') as [string, CellBound];
      const cell = cellBounds.find((c) => c.id === cellId);

      if (cell) {
        const boundPositions = this.positionBoundGroup(nodes, bound, cell);
        boundPositions.forEach((pos, id) => positions.set(id, pos));
      }
    });

    return positions;
  }

  /**
   * Position a group of externals on a specific boundary
   */
  positionBoundGroup(
    nodes: ExternalLayoutData[],
    bound: CellBound,
    cell: CellBounds
  ): Map<string, Position> {
    const positions = new Map<string, Position>();
    const { offset, spacing, defaultNodeWidth, defaultNodeHeight } = this.options;

    // Calculate total width/height of the group
    const totalSize = nodes.reduce((sum, node) => {
      const size =
        bound === 'north' || bound === 'south'
          ? (node.width || defaultNodeWidth)
          : (node.height || defaultNodeHeight);
      return sum + size + spacing;
    }, -spacing); // Subtract last spacing

    // Calculate starting offset to center the group
    const startOffset = -totalSize / 2;

    let currentOffset = startOffset;

    nodes.forEach((node) => {
      const nodeWidth = node.width || defaultNodeWidth;
      const nodeHeight = node.height || defaultNodeHeight;

      let pos: Position;

      switch (bound) {
        case 'north':
          pos = {
            x: cell.x + cell.width / 2 + currentOffset,
            y: cell.y - offset - nodeHeight,
          };
          currentOffset += nodeWidth + spacing;
          break;

        case 'south':
          pos = {
            x: cell.x + cell.width / 2 + currentOffset,
            y: cell.y + cell.height + offset,
          };
          currentOffset += nodeWidth + spacing;
          break;

        case 'east':
          pos = {
            x: cell.x + cell.width + offset,
            y: cell.y + cell.height / 2 + currentOffset,
          };
          currentOffset += nodeHeight + spacing;
          break;

        case 'west':
          pos = {
            x: cell.x - offset - nodeWidth,
            y: cell.y + cell.height / 2 + currentOffset,
          };
          currentOffset += nodeHeight + spacing;
          break;

        default:
          // Default to north
          pos = {
            x: cell.x + cell.width / 2 + currentOffset,
            y: cell.y - offset - nodeHeight,
          };
          currentOffset += nodeWidth + spacing;
      }

      positions.set(node.id, pos);
    });

    return positions;
  }

  /**
   * Group externals by their target cell and boundary
   */
  private groupByBoundary(
    externals: ExternalLayoutData[],
    connections: LayoutEdge[],
    cellBounds: CellBounds[]
  ): Map<string, ExternalLayoutData[]> {
    const groups = new Map<string, ExternalLayoutData[]>();

    externals.forEach((ext) => {
      // Find connection for this external
      const conn = connections.find(
        (c) => c.source === ext.id || c.target === ext.id
      );

      // Determine target cell and boundary
      let targetCellId: string | undefined;
      let bound: CellBound;

      if (conn) {
        // Find the cell this external connects to
        const connectedId = conn.source === ext.id ? conn.target : conn.source;
        const cell = cellBounds.find((c) => c.id === connectedId);
        targetCellId = cell?.id;
      }

      // Use explicit direction or infer from type
      bound = ext.direction || this.inferBound(ext);

      // Default to first cell if no specific cell found
      if (!targetCellId && cellBounds.length > 0) {
        targetCellId = cellBounds[0]!.id;
      }

      if (targetCellId) {
        const key = `${targetCellId}:${bound}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(ext);
      }
    });

    return groups;
  }

  /**
   * Infer boundary from external node type
   */
  inferBound(node: ExternalLayoutData): CellBound {
    // Users default to north (ingress)
    if (node.type === 'user') {
      return 'north';
    }

    // External systems default to south (egress)
    return 'south';
  }

  /**
   * Get the combined bounding box of all cells
   */
  getCombinedBounds(cellBounds: CellBounds[]): BoundingBox {
    if (cellBounds.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    cellBounds.forEach((cell) => {
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x + cell.width);
      maxY = Math.max(maxY, cell.y + cell.height);
    });

    return { minX, minY, maxX, maxY };
  }

  /**
   * Position a single external relative to a cell boundary
   */
  positionRelativeToCell(
    node: LayoutNode,
    cell: CellBounds,
    bound: CellBound
  ): Position {
    const { offset, defaultNodeWidth, defaultNodeHeight } = this.options;
    const nodeWidth = node.width || defaultNodeWidth;
    const nodeHeight = node.height || defaultNodeHeight;

    switch (bound) {
      case 'north':
        return {
          x: cell.x + cell.width / 2 - nodeWidth / 2,
          y: cell.y - offset - nodeHeight,
        };

      case 'south':
        return {
          x: cell.x + cell.width / 2 - nodeWidth / 2,
          y: cell.y + cell.height + offset,
        };

      case 'east':
        return {
          x: cell.x + cell.width + offset,
          y: cell.y + cell.height / 2 - nodeHeight / 2,
        };

      case 'west':
        return {
          x: cell.x - offset - nodeWidth,
          y: cell.y + cell.height / 2 - nodeHeight / 2,
        };

      default:
        return {
          x: cell.x + cell.width / 2 - nodeWidth / 2,
          y: cell.y - offset - nodeHeight,
        };
    }
  }

  /**
   * Configure options
   */
  configure(options: Partial<BoundaryPositionerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

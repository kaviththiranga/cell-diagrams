/**
 * Boundary Positioner
 *
 * Positions external nodes (users, externals) in a three-zone layout:
 * - Header Zone: Nodes connecting TO cells (northbound)
 * - Middle Zone: Cells (handled separately)
 * - Bottom Zone: Nodes that cells connect TO (southbound)
 *
 * Based on: cell-diagram/src/utils/projectUtils.ts (lines 205-287)
 */

import type {
  Position,
  Dimensions,
  BoundingBox,
  CellBound,
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
  /** Padding from diagram edges */
  padding: number;
}

const DEFAULT_BOUNDARY_OPTIONS: BoundaryPositionerOptions = {
  offset: 150,
  spacing: 120,
  defaultNodeWidth: 100,
  defaultNodeHeight: 100,
  padding: 50,
};

/** Cell bounds information */
export interface CellBounds extends Position, Dimensions {
  id: string;
}

/** Result of three-zone positioning */
export interface ThreeZoneResult {
  /** Positioned nodes */
  positions: Map<string, Position>;
  /** Y coordinate where header zone ends */
  headerZoneBottom: number;
  /** Y coordinate where middle zone starts (for cells) */
  middleZoneTop: number;
  /** Y coordinate where bottom zone starts */
  bottomZoneTop: number;
}

/**
 * Positions external nodes in a three-zone layout
 */
export class BoundaryPositioner {
  private options: BoundaryPositionerOptions;

  constructor(options: Partial<BoundaryPositionerOptions> = {}) {
    this.options = { ...DEFAULT_BOUNDARY_OPTIONS, ...options };
  }

  /**
   * Position external nodes in three zones based on connection direction.
   *
   * @param externals External nodes to position
   * @param connections All connections to determine direction
   * @param cellIds Set of cell IDs to identify cell connections
   * @param cellBounds Combined bounding box of all cells (after cell layout)
   * @returns Positioned external nodes and zone boundaries
   */
  positionInThreeZones(
    externals: ExternalLayoutData[],
    connections: LayoutEdge[],
    cellIds: Set<string>,
    cellBounds: BoundingBox
  ): ThreeZoneResult {
    const positions = new Map<string, Position>();
    const { padding, spacing, defaultNodeWidth, defaultNodeHeight, offset } = this.options;

    // Categorize externals into header (northbound) and bottom (southbound)
    const headerNodes: ExternalLayoutData[] = [];
    const bottomNodes: ExternalLayoutData[] = [];

    // Build a map of external -> direction based on connections
    const externalDirections = this.analyzeConnections(externals, connections, cellIds);

    externals.forEach((ext) => {
      const direction = externalDirections.get(ext.id);

      if (direction === 'north' || ext.type === 'user') {
        // Users and north-facing connections go to header
        headerNodes.push(ext);
      } else {
        // Everything else (south, east, west, or no connection) goes to bottom
        bottomNodes.push(ext);
      }
    });

    // Calculate zone positions
    const headerZoneTop = padding;
    const headerHeight = headerNodes.length > 0
      ? Math.max(...headerNodes.map(n => n.height || defaultNodeHeight))
      : 0;
    const headerZoneBottom = headerNodes.length > 0
      ? headerZoneTop + headerHeight + offset
      : padding;

    // Middle zone is where cells will be placed
    const middleZoneTop = headerZoneBottom;

    // Bottom zone starts after cells
    const bottomZoneTop = cellBounds.maxY + offset;

    // Position header nodes (centered above cells)
    if (headerNodes.length > 0) {
      const totalWidth = headerNodes.reduce((sum, n) =>
        sum + (n.width || defaultNodeWidth) + spacing, -spacing
      );

      // Center the header nodes over the cell area
      const cellCenterX = (cellBounds.minX + cellBounds.maxX) / 2;
      let currentX = cellCenterX - totalWidth / 2;

      headerNodes.forEach((node) => {
        const nodeWidth = node.width || defaultNodeWidth;

        positions.set(node.id, {
          x: currentX,
          y: headerZoneTop,
        });

        currentX += nodeWidth + spacing;
      });
    }

    // Position bottom nodes (centered below cells)
    if (bottomNodes.length > 0) {
      const totalWidth = bottomNodes.reduce((sum, n) =>
        sum + (n.width || defaultNodeWidth) + spacing, -spacing
      );

      // Center the bottom nodes under the cell area
      const cellCenterX = (cellBounds.minX + cellBounds.maxX) / 2;
      let currentX = cellCenterX - totalWidth / 2;

      bottomNodes.forEach((node) => {
        const nodeWidth = node.width || defaultNodeWidth;

        positions.set(node.id, {
          x: currentX,
          y: bottomZoneTop,
        });

        currentX += nodeWidth + spacing;
      });
    }

    return {
      positions,
      headerZoneBottom,
      middleZoneTop,
      bottomZoneTop,
    };
  }

  /**
   * Analyze connections to determine external node directions
   */
  private analyzeConnections(
    externals: ExternalLayoutData[],
    connections: LayoutEdge[],
    cellIds: Set<string>
  ): Map<string, CellBound> {
    const directions = new Map<string, CellBound>();
    const externalIds = new Set(externals.map(e => e.id));

    connections.forEach((conn) => {
      // Get base IDs (strip component suffixes like "Cell.Component")
      const sourceBase = conn.source.split('.')[0] ?? conn.source;
      const targetBase = conn.target.split('.')[0] ?? conn.target;

      const sourceIsExternal = externalIds.has(sourceBase);
      const targetIsExternal = externalIds.has(targetBase);
      const sourceIsCell = cellIds.has(sourceBase);
      const targetIsCell = cellIds.has(targetBase);

      // Check connection data for explicit direction
      const connData = conn.data as { direction?: string } | undefined;
      const direction = connData?.direction;

      // External -> Cell (external is source, connects TO a cell)
      if (sourceIsExternal && targetIsCell) {
        // This external connects TO a cell, so it's "incoming" = northbound
        directions.set(sourceBase, direction as CellBound || 'north');
      }

      // Cell -> External (cell is source, connects TO external)
      if (sourceIsCell && targetIsExternal) {
        // This external receives from a cell, so it's "outgoing" = southbound
        directions.set(targetBase, direction as CellBound || 'south');
      }
    });

    return directions;
  }

  /**
   * Position external nodes relative to specific cells (original behavior).
   * Use this when you don't want three-zone layout.
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
   * Configure options
   */
  configure(options: Partial<BoundaryPositionerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Layout Engine
 *
 * Main orchestrator for the auto-positioning layout system.
 * Combines all strategies and algorithms to produce final layout.
 *
 * Based on patterns from: cell-diagram library
 */

import type {
  Position,
  BoundingBox,
  LayoutEngineOptions,
  DiagramLayoutData,
  LayoutResult,
  CellLayoutResult,
  LayoutNode,
  LayoutEdge,
  ILayoutEngine,
} from './types';
import { DEFAULT_LAYOUT_OPTIONS } from './types';

import { DagreAdapter } from './algorithms/DagreAdapter';
import { GridLayout } from './algorithms/GridLayout';
import { TwoGraphStrategy } from './strategies/TwoGraphStrategy';
import { CellSizer } from './strategies/CellSizer';
import { OverlapResolver } from './strategies/OverlapResolver';
import { BoundaryPositioner } from './strategies/BoundaryPositioner';
import { BezierRouter } from './routing/BezierRouter';
import { getPortPosition, getBestPortAlignment } from './routing/PathUtils';

/**
 * Main layout engine that orchestrates all layout strategies
 */
export class LayoutEngine implements ILayoutEngine {
  private options: LayoutEngineOptions;

  // Strategy instances
  private dagreAdapter: DagreAdapter;
  private gridLayout: GridLayout;
  private twoGraphStrategy: TwoGraphStrategy;
  private cellSizer: CellSizer;
  private overlapResolver: OverlapResolver;
  private boundaryPositioner: BoundaryPositioner;
  private bezierRouter: BezierRouter;

  constructor(options: Partial<LayoutEngineOptions> = {}) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

    // Initialize strategies
    this.dagreAdapter = new DagreAdapter({
      rankdir: this.options.rankDirection,
      nodesep: this.options.nodeSpacing,
      ranksep: this.options.rankSpacing,
    });

    this.gridLayout = new GridLayout({
      spacing: this.options.gridSpacing,
    });

    this.twoGraphStrategy = new TwoGraphStrategy();

    this.cellSizer = new CellSizer({
      minCellSize: this.options.minCellSize,
      paddingMultiplier: this.options.cellPaddingMultiplier,
    });

    this.overlapResolver = new OverlapResolver({
      padding: this.options.overlapPadding,
      gridSpacing: this.options.gridSpacing,
    });

    this.boundaryPositioner = new BoundaryPositioner({
      offset: this.options.externalOffset,
      spacing: this.options.externalSpacing,
    });

    this.bezierRouter = new BezierRouter({
      curveOffset: this.options.curveRadius,
    });
  }

  /**
   * Perform complete layout on diagram data using three-zone approach:
   * - Header Zone: Users and externals connecting TO cells (northbound)
   * - Middle Zone: Cells arranged horizontally
   * - Bottom Zone: Externals that cells connect TO (southbound)
   */
  layout(diagram: DiagramLayoutData): LayoutResult {
    const result: LayoutResult = {
      nodes: new Map(),
      edges: new Map(),
      cellDimensions: new Map(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };

    const { padding } = { padding: 50 }; // Default padding

    // 1. Layout each cell's internal components to get dimensions
    const cellResults = new Map<string, CellLayoutResult>();
    diagram.cells.forEach((cell) => {
      const cellResult = this.layoutCell(cell.components, cell.internalConnections);
      cellResults.set(cell.id, cellResult);
      result.cellDimensions.set(cell.id, cellResult.dimensions);
    });

    // 2. Layout cells relative to each other using Dagre (at origin first)
    const cellNodes: LayoutNode[] = diagram.cells.map((cell) => {
      const dims = result.cellDimensions.get(cell.id)!;
      return {
        id: cell.id,
        width: dims.width,
        height: dims.height,
      };
    });

    const relativeCellPositions = this.layoutCells(
      cellNodes,
      diagram.interCellConnections
    );

    // 3. Calculate header zone height based on externals
    const cellIds = new Set(diagram.cells.map(c => c.id));
    const headerNodes = diagram.externals.filter(ext => {
      // Users always go to header
      if (ext.type === 'user') return true;

      // Check if external connects TO a cell (northbound)
      const conn = diagram.connections.find(c =>
        c.source === ext.id || c.target === ext.id
      );
      if (!conn) return true; // Default to header if no connection

      const connData = conn.data as { direction?: string } | undefined;
      return connData?.direction === 'northbound' ||
             (conn.source === ext.id && cellIds.has(conn.target.split('.')[0] ?? ''));
    });

    const bottomNodes = diagram.externals.filter(ext => !headerNodes.includes(ext));

    // Calculate header zone dimensions
    const headerHeight = headerNodes.length > 0
      ? Math.max(...headerNodes.map(n => n.height || 100))
      : 0;
    const headerZoneBottom = headerNodes.length > 0
      ? padding + headerHeight + this.options.externalOffset
      : padding;

    // 4. Offset cell positions to start after header zone
    const cellBounds = this.getBounds(relativeCellPositions, cellNodes);
    const cellOffsetX = padding - cellBounds.minX;
    const cellOffsetY = headerZoneBottom - cellBounds.minY;

    const cellPositions = new Map<string, Position>();
    relativeCellPositions.forEach((pos, id) => {
      cellPositions.set(id, {
        x: pos.x + cellOffsetX,
        y: pos.y + cellOffsetY,
      });
    });

    // 5. Store cell positions and internal components
    cellPositions.forEach((cellPos, cellId) => {
      result.nodes.set(cellId, {
        ...cellPos,
        width: result.cellDimensions.get(cellId)!.width,
        height: result.cellDimensions.get(cellId)!.height,
      });

      const cellResult = cellResults.get(cellId);
      if (cellResult) {
        const dims = result.cellDimensions.get(cellId)!;
        cellResult.nodePositions.forEach((compPos, compId) => {
          result.nodes.set(compId, {
            x: cellPos.x + dims.contentOffset.x + compPos.x,
            y: cellPos.y + dims.contentOffset.y + compPos.y,
            width: 80,
            height: 80,
          });
        });
      }
    });

    // 6. Calculate actual cell bounds after positioning
    const actualCellBounds = this.calculateBounds(
      new Map(
        Array.from(cellPositions.entries()).map(([id, pos]) => [
          id,
          { ...pos, width: result.cellDimensions.get(id)!.width, height: result.cellDimensions.get(id)!.height }
        ])
      )
    );

    // 7. Position header nodes (centered above cells)
    if (headerNodes.length > 0) {
      const totalWidth = headerNodes.reduce(
        (sum, n) => sum + (n.width || 100) + this.options.externalSpacing,
        -this.options.externalSpacing
      );
      const cellCenterX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
      let currentX = cellCenterX - totalWidth / 2;

      headerNodes.forEach((node) => {
        const nodeWidth = node.width || 100;
        result.nodes.set(node.id, {
          x: currentX,
          y: padding,
          width: nodeWidth,
          height: node.height || 100,
        });
        currentX += nodeWidth + this.options.externalSpacing;
      });
    }

    // 8. Position bottom nodes (centered below cells)
    if (bottomNodes.length > 0) {
      const bottomZoneTop = actualCellBounds.maxY + this.options.externalOffset;
      const totalWidth = bottomNodes.reduce(
        (sum, n) => sum + (n.width || 100) + this.options.externalSpacing,
        -this.options.externalSpacing
      );
      const cellCenterX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
      let currentX = cellCenterX - totalWidth / 2;

      bottomNodes.forEach((node) => {
        const nodeWidth = node.width || 100;
        result.nodes.set(node.id, {
          x: currentX,
          y: bottomZoneTop,
          width: nodeWidth,
          height: node.height || 100,
        });
        currentX += nodeWidth + this.options.externalSpacing;
      });
    }

    // 9. Route all edges
    this.routeEdges(diagram.connections, result);

    // 10. Calculate total bounds
    result.bounds = this.calculateBounds(result.nodes);

    return result;
  }

  /**
   * Layout components within a single cell
   */
  private layoutCell(
    components: LayoutNode[],
    connections: LayoutEdge[]
  ): CellLayoutResult {
    if (components.length === 0) {
      return {
        nodePositions: new Map(),
        dimensions: {
          width: this.options.minCellSize,
          height: this.options.minCellSize,
          contentOffset: { x: 0, y: 0 },
        },
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      };
    }

    // Separate linked and unlinked components
    const { linkedNodes, linkedEdges, unlinkedNodes } =
      this.twoGraphStrategy.separate(components, connections);

    let nodePositions: Map<string, Position>;

    if (linkedNodes.length > 0) {
      // Layout linked components with Dagre
      const linkedPositions = this.dagreAdapter.layout(
        linkedNodes,
        linkedEdges,
        this.options
      );

      // Layout unlinked components in grid
      const unlinkedPositions = this.gridLayout.layout(
        unlinkedNodes,
        [],
        this.options
      );

      // Get linked bounds for merging
      const linkedBounds = this.getBounds(linkedPositions, linkedNodes);

      // Merge positions
      nodePositions = this.twoGraphStrategy.merge(
        linkedPositions,
        unlinkedPositions,
        linkedBounds,
        this.options.nodeSpacing
      );
    } else {
      // All nodes are unlinked, use grid layout
      nodePositions = this.gridLayout.layout(components, [], this.options);
    }

    // Resolve overlaps
    nodePositions = this.overlapResolver.resolve(nodePositions, components);

    // Calculate cell dimensions
    const dimensions = this.cellSizer.calculateSize(
      nodePositions,
      this.buildDimensionsMap(components)
    );

    // Calculate bounds
    const bounds = this.getBounds(nodePositions, components);

    return { nodePositions, dimensions, bounds };
  }

  /**
   * Layout cells relative to each other
   */
  private layoutCells(
    cells: LayoutNode[],
    interCellConnections: LayoutEdge[]
  ): Map<string, Position> {
    if (cells.length === 0) {
      return new Map();
    }

    if (cells.length === 1) {
      // Single cell, center it
      return new Map([[cells[0]!.id, { x: 0, y: 0 }]]);
    }

    // Use Dagre for cell layout
    return this.dagreAdapter.layout(cells, interCellConnections, {
      ...this.options,
      nodeSpacing: this.options.nodeSpacing * 2, // More spacing between cells
      rankSpacing: this.options.rankSpacing * 2,
    });
  }

  /**
   * Route all edges
   */
  private routeEdges(
    connections: LayoutEdge[],
    result: LayoutResult
  ): void {
    connections.forEach((conn) => {
      const sourceNode = result.nodes.get(conn.source);
      const targetNode = result.nodes.get(conn.target);

      if (!sourceNode || !targetNode) {
        return;
      }

      // Get best port alignments
      const ports = getBestPortAlignment(
        { x: sourceNode.x, y: sourceNode.y },
        sourceNode.width,
        sourceNode.height,
        { x: targetNode.x, y: targetNode.y },
        targetNode.width,
        targetNode.height
      );

      // Get port positions
      const sourcePos = getPortPosition(
        { x: sourceNode.x, y: sourceNode.y },
        sourceNode.width,
        sourceNode.height,
        ports.source
      );

      const targetPos = getPortPosition(
        { x: targetNode.x, y: targetNode.y },
        targetNode.width,
        targetNode.height,
        ports.target
      );

      // Route edge
      const path = this.bezierRouter.route(sourcePos, targetPos, {
        sourcePort: ports.source,
        targetPort: ports.target,
      });

      result.edges.set(conn.id, {
        id: conn.id,
        source: conn.source,
        target: conn.target,
        path,
        sourcePort: ports.source,
        targetPort: ports.target,
      });
    });
  }

  /**
   * Build dimensions map from nodes
   */
  private buildDimensionsMap(
    nodes: LayoutNode[]
  ): Map<string, { width: number; height: number }> {
    const map = new Map<string, { width: number; height: number }>();
    nodes.forEach((node) => {
      map.set(node.id, { width: node.width, height: node.height });
    });
    return map;
  }

  /**
   * Get bounding box of positions
   */
  private getBounds(
    positions: Map<string, Position>,
    nodes: LayoutNode[]
  ): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    positions.forEach((pos, id) => {
      const node = nodes.find((n) => n.id === id);
      const width = node?.width || 80;
      const height = node?.height || 80;

      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + width);
      maxY = Math.max(maxY, pos.y + height);
    });

    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Calculate total bounds from all node positions
   */
  private calculateBounds(
    nodes: Map<string, { x: number; y: number; width: number; height: number }>
  ): BoundingBox {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Configure layout options
   */
  configure(options: Partial<LayoutEngineOptions>): void {
    this.options = { ...this.options, ...options };

    // Update strategy configurations
    this.dagreAdapter.configure({
      rankdir: this.options.rankDirection,
      nodesep: this.options.nodeSpacing,
      ranksep: this.options.rankSpacing,
    });

    this.gridLayout.configure({
      spacing: this.options.gridSpacing,
    });

    this.cellSizer.configure({
      minCellSize: this.options.minCellSize,
      paddingMultiplier: this.options.cellPaddingMultiplier,
    });

    this.overlapResolver.configure({
      padding: this.options.overlapPadding,
      gridSpacing: this.options.gridSpacing,
    });

    this.boundaryPositioner.configure({
      offset: this.options.externalOffset,
      spacing: this.options.externalSpacing,
    });

    this.bezierRouter.configure({
      curveOffset: this.options.curveRadius,
    });
  }

  /**
   * Get current options
   */
  getOptions(): LayoutEngineOptions {
    return { ...this.options };
  }
}

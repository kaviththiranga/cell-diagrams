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
  CellDimensions,
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
import { BoundaryPositioner, CellBounds } from './strategies/BoundaryPositioner';
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
   * Perform complete layout on diagram data
   */
  layout(diagram: DiagramLayoutData): LayoutResult {
    const result: LayoutResult = {
      nodes: new Map(),
      edges: new Map(),
      cellDimensions: new Map(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };

    // 1. Layout each cell's internal components
    const cellResults = new Map<string, CellLayoutResult>();
    diagram.cells.forEach((cell) => {
      const cellResult = this.layoutCell(cell.components, cell.internalConnections);
      cellResults.set(cell.id, cellResult);
      result.cellDimensions.set(cell.id, cellResult.dimensions);
    });

    // 2. Layout cells relative to each other using Dagre
    const cellNodes: LayoutNode[] = diagram.cells.map((cell) => {
      const dims = result.cellDimensions.get(cell.id)!;
      return {
        id: cell.id,
        width: dims.width,
        height: dims.height,
      };
    });

    const cellPositions = this.layoutCells(
      cellNodes,
      diagram.interCellConnections
    );

    // 3. Position cells and their internal components
    cellPositions.forEach((cellPos, cellId) => {
      // Store cell position
      result.nodes.set(cellId, {
        ...cellPos,
        width: result.cellDimensions.get(cellId)!.width,
        height: result.cellDimensions.get(cellId)!.height,
      });

      // Offset internal components relative to cell position
      const cellResult = cellResults.get(cellId);
      if (cellResult) {
        const dims = result.cellDimensions.get(cellId)!;
        cellResult.nodePositions.forEach((compPos, compId) => {
          result.nodes.set(compId, {
            x: cellPos.x + dims.contentOffset.x + compPos.x,
            y: cellPos.y + dims.contentOffset.y + compPos.y,
            width: 80, // Default component width
            height: 80, // Default component height
          });
        });
      }
    });

    // 4. Position external nodes based on boundaries
    const cellBoundsList = this.buildCellBounds(cellPositions, result.cellDimensions);
    const externalPositions = this.boundaryPositioner.positionExternals(
      diagram.externals,
      cellBoundsList,
      diagram.connections
    );

    externalPositions.forEach((pos, id) => {
      const ext = diagram.externals.find((e) => e.id === id);
      result.nodes.set(id, {
        ...pos,
        width: ext?.width || 80,
        height: ext?.height || 80,
      });
    });

    // 5. Route all edges
    this.routeEdges(diagram.connections, result);

    // 6. Calculate total bounds
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
   * Build cell bounds array from positions and dimensions
   */
  private buildCellBounds(
    positions: Map<string, Position>,
    dimensions: Map<string, CellDimensions>
  ): CellBounds[] {
    const bounds: CellBounds[] = [];

    positions.forEach((pos, id) => {
      const dims = dimensions.get(id);
      if (dims) {
        bounds.push({
          id,
          x: pos.x,
          y: pos.y,
          width: dims.width,
          height: dims.height,
        });
      }
    });

    return bounds;
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

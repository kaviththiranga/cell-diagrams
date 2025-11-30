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
  ExternalLayoutData,
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
   * Perform complete layout on diagram data using four-zone approach:
   * - Zone 1 (Top): Users/clients
   * - Zone 2: Northbound externals (frontends connecting TO cells)
   * - Zone 3 (Middle): Cells arranged HORIZONTALLY
   * - Zone 4 (Bottom): Southbound externals (cells connect TO these)
   */
  layout(diagram: DiagramLayoutData): LayoutResult {
    const result: LayoutResult = {
      nodes: new Map(),
      edges: new Map(),
      cellDimensions: new Map(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };

    const padding = 50;
    const levelSpacing = 80; // Spacing between levels

    // 1. Get cell dimensions - use pre-calculated if available, otherwise calculate
    const cellResults = new Map<string, CellLayoutResult>();
    diagram.cells.forEach((cell) => {
      // Use pre-calculated dimensions from converter if available
      if (cell.dimensions) {
        const dimensions = {
          width: cell.dimensions.width,
          height: cell.dimensions.height,
          contentOffset: { x: 0, y: 0 },
        };
        cellResults.set(cell.id, {
          nodePositions: new Map(),
          dimensions,
          bounds: { minX: 0, minY: 0, maxX: dimensions.width, maxY: dimensions.height },
        });
        result.cellDimensions.set(cell.id, dimensions);
      } else {
        // Calculate dimensions from components
        const cellResult = this.layoutCell(cell.components, cell.internalConnections);
        cellResults.set(cell.id, cellResult);
        result.cellDimensions.set(cell.id, cellResult.dimensions);
      }
    });

    // 2. Categorize externals into four zones:
    //    - userNodes: Users/clients (top level)
    //    - northboundNodes: Externals connecting TO cells (second level)
    //    - bottomNodes: Externals that cells connect TO (southbound)
    const cellIds = new Set(diagram.cells.map(c => c.id));
    const userNodes: ExternalLayoutData[] = [];
    const northboundNodes: ExternalLayoutData[] = [];
    const bottomNodes: ExternalLayoutData[] = [];

    for (const ext of diagram.externals) {
      // Users always go to top level
      if (ext.type === 'user') {
        userNodes.push(ext);
        continue;
      }

      // Find connections involving this external
      let isNorthbound = false;
      let isSouthbound = false;

      for (const conn of diagram.connections) {
        const connData = conn.data as { direction?: string } | undefined;
        const direction = connData?.direction;

        // External is source
        if (conn.source === ext.id) {
          const targetBase = conn.target.split('.')[0] ?? '';
          if (cellIds.has(targetBase)) {
            // External -> Cell: northbound means external is above cell
            if (direction === 'northbound') {
              isNorthbound = true;
            } else if (direction === 'southbound') {
              isSouthbound = true;
            } else {
              // No direction specified, default to northbound if connecting to cell
              isNorthbound = true;
            }
          }
        }

        // External is target
        if (conn.target === ext.id) {
          const sourceBase = conn.source.split('.')[0] ?? '';
          if (cellIds.has(sourceBase)) {
            // Cell -> External: southbound means external is below cell
            if (direction === 'southbound') {
              isSouthbound = true;
            } else if (direction === 'northbound') {
              isNorthbound = true;
            } else {
              // No direction specified, default to bottom if cell connects to external
              isSouthbound = true;
            }
          }
        }
      }

      // Categorize based on analysis
      if (isSouthbound && !isNorthbound) {
        bottomNodes.push(ext);
      } else {
        // Northbound externals go to second level
        northboundNodes.push(ext);
      }
    }

    // 3. Calculate zone heights
    const userHeight = userNodes.length > 0
      ? Math.max(...userNodes.map(n => n.height || 100))
      : 0;
    const northboundHeight = northboundNodes.length > 0
      ? Math.max(...northboundNodes.map(n => n.height || 100))
      : 0;

    // Calculate Y positions for each zone
    const userZoneY = padding;
    const northboundZoneY = userNodes.length > 0
      ? userZoneY + userHeight + levelSpacing
      : padding;
    const cellZoneY = northboundNodes.length > 0
      ? northboundZoneY + northboundHeight + this.options.externalOffset
      : (userNodes.length > 0 ? userZoneY + userHeight + this.options.externalOffset : padding);

    // 4. Arrange cells HORIZONTALLY in the middle zone
    const cellPositions = new Map<string, Position>();
    let cellX = padding;

    for (const cell of diagram.cells) {
      const dims = result.cellDimensions.get(cell.id)!;
      cellPositions.set(cell.id, { x: cellX, y: cellZoneY });
      cellX += dims.width + this.options.nodeSpacing;
    }

    // 5. Store cell positions and internal components
    cellPositions.forEach((cellPos, cellId) => {
      const dims = result.cellDimensions.get(cellId)!;
      result.nodes.set(cellId, {
        ...cellPos,
        width: dims.width,
        height: dims.height,
      });

      const cellResult = cellResults.get(cellId);
      if (cellResult) {
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

    // 7. Position user nodes (Zone 1 - top level)
    // Users are positioned based on which frontend apps they connect to
    if (userNodes.length > 0) {
      // Build map of user -> connected externals (frontends)
      const userConnections = new Map<string, string[]>();
      for (const user of userNodes) {
        const connectedExternals: string[] = [];
        for (const conn of diagram.connections) {
          if (conn.source === user.id) {
            // Check if target is a northbound external
            const isNorthboundTarget = northboundNodes.some(n => n.id === conn.target);
            if (isNorthboundTarget && !connectedExternals.includes(conn.target)) {
              connectedExternals.push(conn.target);
            }
          }
        }
        userConnections.set(user.id, connectedExternals);
      }

      // We'll position users after northbound externals are positioned
      // For now, collect user positioning data
      const userPositionData = userNodes.map(user => ({
        node: user,
        connectedExternals: userConnections.get(user.id) || [],
      }));

      // Store for later positioning after northbound nodes
      (result as unknown as { _userPositionData: typeof userPositionData })._userPositionData = userPositionData;
    }

    // 8. Position northbound external nodes (Zone 2 - second level)
    const northboundPositionMap = new Map<string, number>(); // Store X positions for user alignment
    if (northboundNodes.length > 0) {
      // Build map of northbound node -> connected cells
      const northboundNodeConnections = new Map<string, string[]>();
      for (const node of northboundNodes) {
        const connectedCells: string[] = [];
        for (const conn of diagram.connections) {
          if (conn.source === node.id) {
            const targetBase = conn.target.split('.')[0] ?? '';
            if (cellIds.has(targetBase) && !connectedCells.includes(targetBase)) {
              connectedCells.push(targetBase);
            }
          }
          if (conn.target === node.id) {
            const sourceBase = conn.source.split('.')[0] ?? '';
            if (cellIds.has(sourceBase) && !connectedCells.includes(sourceBase)) {
              connectedCells.push(sourceBase);
            }
          }
        }
        northboundNodeConnections.set(node.id, connectedCells);
      }

      // Calculate target X for each northbound node based on connected cells
      const northboundPositions: Array<{ node: ExternalLayoutData; targetX: number }> = [];
      for (const node of northboundNodes) {
        const connectedCells = northboundNodeConnections.get(node.id) || [];
        let targetX: number;

        if (connectedCells.length > 0) {
          // Position above the average center of connected cells
          const cellCenters = connectedCells.map(cellId => {
            const cellPos = cellPositions.get(cellId);
            const cellDims = result.cellDimensions.get(cellId);
            if (cellPos && cellDims) {
              return cellPos.x + cellDims.width / 2;
            }
            return 0;
          });
          targetX = cellCenters.reduce((a, b) => a + b, 0) / cellCenters.length;
        } else {
          // Default to center if no connections
          targetX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
        }
        northboundPositions.push({ node, targetX });
      }

      // Sort by target X to maintain left-to-right order
      northboundPositions.sort((a, b) => a.targetX - b.targetX);

      // Position nodes with collision avoidance
      const nodeWidth = 100;
      const minSpacing = this.options.externalSpacing;
      const placedPositions: Array<{ x: number; width: number }> = [];

      for (const { node, targetX } of northboundPositions) {
        const width = node.width || nodeWidth;
        let finalX = targetX - width / 2;

        // Check for collisions with already placed nodes and adjust
        for (const placed of placedPositions) {
          const overlap = (finalX < placed.x + placed.width + minSpacing) &&
                         (finalX + width > placed.x - minSpacing);
          if (overlap) {
            // Move to the right of the placed node
            finalX = Math.max(finalX, placed.x + placed.width + minSpacing);
          }
        }

        result.nodes.set(node.id, {
          x: finalX,
          y: northboundZoneY,
          width,
          height: node.height || 100,
        });
        placedPositions.push({ x: finalX, width });
        northboundPositionMap.set(node.id, finalX + width / 2); // Store center X
      }
    }

    // Now position users based on their connected frontends
    if (userNodes.length > 0) {
      const userPositions: Array<{ node: ExternalLayoutData; targetX: number }> = [];

      for (const user of userNodes) {
        // Find connected frontends
        const connectedExternals: string[] = [];
        for (const conn of diagram.connections) {
          if (conn.source === user.id) {
            const isNorthboundTarget = northboundNodes.some(n => n.id === conn.target);
            if (isNorthboundTarget) {
              connectedExternals.push(conn.target);
            }
          }
        }

        let targetX: number;
        if (connectedExternals.length > 0) {
          // Position above connected frontends
          const frontendCenters = connectedExternals
            .map(id => northboundPositionMap.get(id))
            .filter((x): x is number => x !== undefined);
          if (frontendCenters.length > 0) {
            targetX = frontendCenters.reduce((a, b) => a + b, 0) / frontendCenters.length;
          } else {
            targetX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
          }
        } else {
          // Default to center
          targetX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
        }
        userPositions.push({ node: user, targetX });
      }

      // Sort by target X
      userPositions.sort((a, b) => a.targetX - b.targetX);

      // Position with collision avoidance
      const nodeWidth = 100;
      const minSpacing = this.options.externalSpacing;
      const placedPositions: Array<{ x: number; width: number }> = [];

      for (const { node, targetX } of userPositions) {
        const width = node.width || nodeWidth;
        let finalX = targetX - width / 2;

        for (const placed of placedPositions) {
          const overlap = (finalX < placed.x + placed.width + minSpacing) &&
                         (finalX + width > placed.x - minSpacing);
          if (overlap) {
            finalX = Math.max(finalX, placed.x + placed.width + minSpacing);
          }
        }

        result.nodes.set(node.id, {
          x: finalX,
          y: userZoneY,
          width,
          height: node.height || 100,
        });
        placedPositions.push({ x: finalX, width });
      }
    }

    // 9. Position bottom nodes (Zone 4) - align with connected cells to reduce overlaps
    if (bottomNodes.length > 0) {
      const bottomZoneTop = actualCellBounds.maxY + this.options.externalOffset;

      // Build map of bottom node -> connected cells
      const bottomNodeConnections = new Map<string, string[]>();
      for (const node of bottomNodes) {
        const connectedCells: string[] = [];
        for (const conn of diagram.connections) {
          if (conn.source === node.id) {
            const targetBase = conn.target.split('.')[0] ?? '';
            if (cellIds.has(targetBase) && !connectedCells.includes(targetBase)) {
              connectedCells.push(targetBase);
            }
          }
          if (conn.target === node.id) {
            const sourceBase = conn.source.split('.')[0] ?? '';
            if (cellIds.has(sourceBase) && !connectedCells.includes(sourceBase)) {
              connectedCells.push(sourceBase);
            }
          }
        }
        bottomNodeConnections.set(node.id, connectedCells);
      }

      // Calculate target X for each bottom node based on connected cells
      const bottomPositions: Array<{ node: ExternalLayoutData; targetX: number }> = [];
      for (const node of bottomNodes) {
        const connectedCells = bottomNodeConnections.get(node.id) || [];
        let targetX: number;

        if (connectedCells.length > 0) {
          // Position below the average center of connected cells
          const cellCenters = connectedCells.map(cellId => {
            const cellPos = cellPositions.get(cellId);
            const cellDims = result.cellDimensions.get(cellId);
            if (cellPos && cellDims) {
              return cellPos.x + cellDims.width / 2;
            }
            return 0;
          });
          targetX = cellCenters.reduce((a, b) => a + b, 0) / cellCenters.length;
        } else {
          // Default to center if no connections
          targetX = (actualCellBounds.minX + actualCellBounds.maxX) / 2;
        }
        bottomPositions.push({ node, targetX });
      }

      // Sort by target X to maintain left-to-right order
      bottomPositions.sort((a, b) => a.targetX - b.targetX);

      // Position nodes with collision avoidance
      const nodeWidth = 100;
      const minSpacing = this.options.externalSpacing;
      const placedPositions: Array<{ x: number; width: number }> = [];

      for (const { node, targetX } of bottomPositions) {
        const width = node.width || nodeWidth;
        let finalX = targetX - width / 2;

        // Check for collisions with already placed nodes and adjust
        for (const placed of placedPositions) {
          const overlap = (finalX < placed.x + placed.width + minSpacing) &&
                         (finalX + width > placed.x - minSpacing);
          if (overlap) {
            // Move to the right of the placed node
            finalX = Math.max(finalX, placed.x + placed.width + minSpacing);
          }
        }

        result.nodes.set(node.id, {
          x: finalX,
          y: bottomZoneTop,
          width,
          height: node.height || 100,
        });
        placedPositions.push({ x: finalX, width });
      }
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

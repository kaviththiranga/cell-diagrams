/**
 * Dagre Layout Algorithm Adapter
 *
 * Wraps the Dagre library for hierarchical graph layout.
 *
 * Based on: cell-diagram/src/resources/Dagre/DagreEngine.ts
 */

import dagre from 'dagre';
import type {
  LayoutNode,
  LayoutEdge,
  Position,
  BoundingBox,
  ILayoutAlgorithm,
  LayoutEngineOptions,
  RankDirection,
} from '../types';

export interface DagreLayoutOptions {
  /** Direction of the graph layout */
  rankdir: RankDirection;
  /** Separation between nodes in the same rank */
  nodesep: number;
  /** Separation between ranks */
  ranksep: number;
  /** Separation between edges */
  edgesep: number;
  /** Ranker algorithm: 'network-simplex', 'tight-tree', or 'longest-path' */
  ranker: 'network-simplex' | 'tight-tree' | 'longest-path';
  /** Alignment within ranks: 'UL', 'UR', 'DL', 'DR' */
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

const DEFAULT_DAGRE_OPTIONS: DagreLayoutOptions = {
  rankdir: 'TB',
  nodesep: 80,
  ranksep: 100,
  edgesep: 50,
  ranker: 'tight-tree',
};

/**
 * Dagre adapter for hierarchical graph layout
 */
export class DagreAdapter implements ILayoutAlgorithm {
  private options: DagreLayoutOptions;

  constructor(options: Partial<DagreLayoutOptions> = {}) {
    this.options = { ...DEFAULT_DAGRE_OPTIONS, ...options };
  }

  /**
   * Layout nodes using Dagre algorithm
   */
  layout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    engineOptions?: Partial<LayoutEngineOptions>
  ): Map<string, Position> {
    // Map engine options to dagre options
    const dagreOptions: DagreLayoutOptions = {
      ...this.options,
      rankdir: engineOptions?.rankDirection ?? this.options.rankdir,
      nodesep: engineOptions?.nodeSpacing ?? this.options.nodesep,
      ranksep: engineOptions?.rankSpacing ?? this.options.ranksep,
    };

    return this.layoutWithOptions(nodes, edges, dagreOptions);
  }

  /**
   * Layout nodes with specific Dagre options
   */
  layoutWithOptions(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: Partial<DagreLayoutOptions> = {}
  ): Map<string, Position> {
    const opts = { ...this.options, ...options };
    const positions = new Map<string, Position>();

    if (nodes.length === 0) {
      return positions;
    }

    // Create a new directed graph
    const g = new dagre.graphlib.Graph({
      multigraph: true,
      compound: true,
    });

    // Set graph options
    g.setGraph({
      rankdir: opts.rankdir,
      nodesep: opts.nodesep,
      ranksep: opts.ranksep,
      edgesep: opts.edgesep,
      ranker: opts.ranker,
      align: opts.align,
    });

    // Default edge label to empty object
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to graph
    nodes.forEach((node) => {
      g.setNode(node.id, {
        label: node.id,
        width: node.width,
        height: node.height,
      });
    });

    // Add edges to graph
    edges.forEach((edge) => {
      // Only add edge if both nodes exist
      if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
        g.setEdge(edge.source, edge.target, {
          name: edge.id,
        });
      }
    });

    // Run layout algorithm
    dagre.layout(g);

    // Extract positions from graph
    // Dagre returns center positions, so we need to convert to top-left
    g.nodes().forEach((nodeId: string) => {
      const nodeData = g.node(nodeId);
      if (nodeData) {
        positions.set(nodeId, {
          x: nodeData.x - nodeData.width / 2,
          y: nodeData.y - nodeData.height / 2,
        });
      }
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
      if (!node) return;

      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + node.width);
      maxY = Math.max(maxY, pos.y + node.height);
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
  configure(options: Partial<DagreLayoutOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): DagreLayoutOptions {
    return { ...this.options };
  }
}

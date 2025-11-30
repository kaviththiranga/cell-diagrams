/**
 * Two-Graph Strategy
 *
 * Separates nodes into linked and unlinked graphs to prevent
 * unconnected nodes from disrupting the main layout algorithm.
 *
 * Based on: cell-diagram/src/resources/Dagre/DagreEngine.ts (lines 82-111)
 */

import type {
  LayoutNode,
  LayoutEdge,
  Position,
  BoundingBox,
  SeparatedGraphs,
} from '../types';

/**
 * Strategy for separating linked and unlinked nodes
 */
export class TwoGraphStrategy {
  /**
   * Separate nodes into linked and unlinked groups
   *
   * @param nodes All nodes to separate
   * @param edges Edges connecting nodes
   * @returns Separated graphs with linked and unlinked nodes
   */
  separate(nodes: LayoutNode[], edges: LayoutEdge[]): SeparatedGraphs {
    // Build set of connected node IDs
    const connectedNodeIds = new Set<string>();

    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // Separate nodes based on connectivity
    const linkedNodes: LayoutNode[] = [];
    const unlinkedNodes: LayoutNode[] = [];

    nodes.forEach((node) => {
      if (connectedNodeIds.has(node.id)) {
        linkedNodes.push(node);
      } else {
        unlinkedNodes.push(node);
      }
    });

    // Only include edges that connect linked nodes
    const linkedEdges = edges.filter(
      (edge) =>
        connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
    );

    return {
      linkedNodes,
      linkedEdges,
      unlinkedNodes,
    };
  }

  /**
   * Merge linked and unlinked positions
   *
   * Positions unlinked nodes below the linked graph with appropriate spacing
   *
   * @param linkedPositions Positions of linked nodes
   * @param unlinkedPositions Positions of unlinked nodes (relative, starting at 0,0)
   * @param linkedBounds Bounding box of linked nodes
   * @param spacing Vertical spacing between linked and unlinked regions
   * @returns Merged positions for all nodes
   */
  merge(
    linkedPositions: Map<string, Position>,
    unlinkedPositions: Map<string, Position>,
    linkedBounds: BoundingBox,
    spacing: number = 100
  ): Map<string, Position> {
    const merged = new Map<string, Position>(linkedPositions);

    // If no linked nodes, just return unlinked positions as-is
    if (linkedPositions.size === 0) {
      return unlinkedPositions;
    }

    // If no unlinked nodes, just return linked positions
    if (unlinkedPositions.size === 0) {
      return linkedPositions;
    }

    // Position unlinked nodes below the linked graph
    const offsetY = linkedBounds.maxY + spacing;
    const offsetX = linkedBounds.minX;

    unlinkedPositions.forEach((pos, id) => {
      merged.set(id, {
        x: offsetX + pos.x,
        y: offsetY + pos.y,
      });
    });

    return merged;
  }

  /**
   * Check if a node is connected (has any edges)
   */
  isConnected(nodeId: string, edges: LayoutEdge[]): boolean {
    return edges.some(
      (edge) => edge.source === nodeId || edge.target === nodeId
    );
  }

  /**
   * Get connection count for a node
   */
  getConnectionCount(nodeId: string, edges: LayoutEdge[]): number {
    return edges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId
    ).length;
  }

  /**
   * Get connected node IDs from a set of edges
   */
  getConnectedNodeIds(edges: LayoutEdge[]): Set<string> {
    const ids = new Set<string>();
    edges.forEach((edge) => {
      ids.add(edge.source);
      ids.add(edge.target);
    });
    return ids;
  }
}

/**
 * CellDiagram Component
 *
 * Main component for rendering Cell Diagrams.
 */

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { useCellDiagram } from '../hooks/useCellDiagram';
import type { CellDiagramProps, DiagramNodeData, ConnectionEdgeData } from '../types';

import '@xyflow/react/dist/style.css';

export function CellDiagram({
  source = '',
  layoutOptions,
  onNodeClick,
  onEdgeClick,
  fitView = true,
  className = '',
}: CellDiagramProps) {
  const { diagram, success, errors } = useCellDiagram({
    source,
    layoutOptions,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);

  // Update nodes/edges when diagram changes
  if (
    JSON.stringify(diagram.nodes) !== JSON.stringify(nodes) ||
    JSON.stringify(diagram.edges) !== JSON.stringify(edges)
  ) {
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
  }

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (onNodeClick) {
        onNodeClick(node.id, node.data as DiagramNodeData);
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.id, edge.data as ConnectionEdgeData);
      }
    },
    [onEdgeClick]
  );

  // Show errors if parsing failed
  if (!success && errors.length > 0) {
    return (
      <div className={`cell-diagram-error ${className}`}>
        <div className="error-title">Parse Errors</div>
        <ul className="error-list">
          {errors.map((error, idx) => (
            <li key={idx}>
              Line {error.line}:{error.column}: {error.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`cell-diagram ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes as NodeTypes}
        edgeTypes={edgeTypes as EdgeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

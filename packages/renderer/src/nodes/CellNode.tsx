/**
 * CellNode Component
 *
 * Renders a Cell-Based Architecture cell with its components and endpoints.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CellNode as CellNodeType, CellNodeData, ComponentNodeData } from '../types';
import { COMPONENT_ICONS, CELL_TYPE_COLORS } from '../types';

function CellNodeComponent({ data, selected }: NodeProps<CellNodeType>) {
  const cellData = data as CellNodeData;
  const borderColor = cellData.cellType
    ? CELL_TYPE_COLORS[cellData.cellType]
    : CELL_TYPE_COLORS.logic;

  return (
    <div
      className={`cell-node ${selected ? 'selected' : ''}`}
      style={{
        borderColor,
        borderWidth: selected ? 3 : 2,
      }}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="cell-handle" />

      {/* Header */}
      <div className="cell-node-header" style={{ backgroundColor: borderColor }}>
        <span className="cell-node-title">{cellData.label}</span>
        {cellData.cellType && (
          <span className="cell-node-type">{cellData.cellType}</span>
        )}
      </div>

      {/* Components */}
      {cellData.components.length > 0 && (
        <div className="cell-node-components">
          {cellData.components.map((comp: ComponentNodeData) => (
            <ComponentItem key={comp.id} component={comp} />
          ))}
        </div>
      )}

      {/* Endpoints */}
      {cellData.endpoints.length > 0 && (
        <div className="cell-node-endpoints">
          {cellData.endpoints.map((ep, idx: number) => (
            <div key={idx} className={`cell-endpoint cell-endpoint-${ep.endpointType}`}>
              <span className="endpoint-type">{ep.endpointType}</span>
              <span className="endpoint-ref">{ep.componentRef}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="cell-handle" />
    </div>
  );
}

interface ComponentItemProps {
  component: ComponentNodeData;
}

function ComponentItem({ component }: ComponentItemProps) {
  const icon = COMPONENT_ICONS[component.componentType];

  return (
    <div className={`component-item component-${component.componentType}`}>
      <span className="component-icon">{icon}</span>
      <span className="component-label">{component.label}</span>
      <span className="component-type-badge">{component.componentType}</span>
    </div>
  );
}

export const CellNode = memo(CellNodeComponent);

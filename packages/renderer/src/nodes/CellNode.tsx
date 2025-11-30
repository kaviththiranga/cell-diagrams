/**
 * CellNode Component
 *
 * Renders a Cell-Based Architecture cell with octagon shape,
 * gateway at boundary, and components inside.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type {
  CellNode as CellNodeType,
  CellNodeData,
  ComponentNodeData,
  ClusterNodeData,
  GatewayNodeData,
} from '../types';
import { COMPONENT_ICONS, CELL_TYPE_COLORS } from '../types';

function CellNodeComponent({ data, selected }: NodeProps<CellNodeType>) {
  const cellData = data as CellNodeData;
  const borderColor = CELL_TYPE_COLORS[cellData.cellType] ?? CELL_TYPE_COLORS.logic;

  return (
    <div
      className={`cell-node cell-node-octagon ${selected ? 'selected' : ''}`}
      style={
        {
          '--cell-color': borderColor,
          '--cell-border-width': selected ? '3px' : '2px',
        } as React.CSSProperties
      }
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="cell-handle" />

      {/* Header with Cell Type Badge */}
      <div className="cell-node-header">
        <span className="cell-node-title">{cellData.label}</span>
        <span className="cell-node-type-badge" style={{ backgroundColor: borderColor }}>
          {cellData.cellType}
        </span>
      </div>

      {/* Gateway at Cell Boundary */}
      {cellData.gateway && <GatewaySection gateway={cellData.gateway} />}

      {/* Components Section */}
      {cellData.components.length > 0 && (
        <div className="cell-node-components">
          <div className="section-label">Components</div>
          {cellData.components.map((comp: ComponentNodeData) => (
            <ComponentItem key={comp.id} component={comp} />
          ))}
        </div>
      )}

      {/* Clusters Section */}
      {cellData.clusters.length > 0 && (
        <div className="cell-node-clusters">
          {cellData.clusters.map((cluster: ClusterNodeData) => (
            <ClusterSection key={cluster.id} cluster={cluster} />
          ))}
        </div>
      )}

      {/* Internal Connections (shown as indicator) */}
      {cellData.internalConnections.length > 0 && (
        <div className="cell-node-connections-indicator">
          <span className="connections-count">
            {cellData.internalConnections.length} internal connections
          </span>
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="cell-handle" />
    </div>
  );
}

interface GatewaySectionProps {
  gateway: GatewayNodeData;
}

function GatewaySection({ gateway }: GatewaySectionProps) {
  return (
    <div className="cell-gateway">
      <div className="gateway-header">
        <span className="gateway-icon">🚪</span>
        <span className="gateway-id">{gateway.id}</span>
        {gateway.hasAuth && (
          <span className="gateway-auth-badge" title={gateway.authType}>
            🔐
          </span>
        )}
      </div>
      {gateway.exposes.length > 0 && (
        <div className="gateway-exposes">
          {gateway.exposes.map((ep, idx) => (
            <span key={idx} className={`gateway-endpoint endpoint-${ep}`}>
              {ep}
            </span>
          ))}
        </div>
      )}
      {gateway.policies && gateway.policies.length > 0 && (
        <div className="gateway-policies">
          {gateway.policies.map((policy, idx) => (
            <span key={idx} className="gateway-policy">
              {policy}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ComponentItemProps {
  component: ComponentNodeData;
}

function ComponentItem({ component }: ComponentItemProps) {
  const icon = COMPONENT_ICONS[component.componentType] ?? '📦';

  return (
    <div className={`component-item component-${component.componentType}`}>
      <span className="component-icon">{icon}</span>
      <span className="component-label">{component.label}</span>
      <span className="component-type-badge">{component.componentType}</span>
      {component.sidecars && component.sidecars.length > 0 && (
        <div className="component-sidecars">
          {component.sidecars.map((sidecar, idx) => (
            <span key={idx} className="sidecar-badge">
              {sidecar}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClusterSectionProps {
  cluster: ClusterNodeData;
}

function ClusterSection({ cluster }: ClusterSectionProps) {
  return (
    <div className="cell-cluster">
      <div className="cluster-header">
        <span className="cluster-icon">⚙️</span>
        <span className="cluster-id">{cluster.id}</span>
        {cluster.replicas && (
          <span className="cluster-replicas" title="Replicas">
            ×{cluster.replicas}
          </span>
        )}
      </div>
      <div className="cluster-components">
        {cluster.components.map((comp) => (
          <ComponentItem key={comp.id} component={comp} />
        ))}
      </div>
    </div>
  );
}

export const CellNode = memo(CellNodeComponent);

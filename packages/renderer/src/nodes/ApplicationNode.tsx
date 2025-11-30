/**
 * ApplicationNode Component
 *
 * Renders a virtual application (group of cells)
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type {
  ApplicationNode as ApplicationNodeType,
  ApplicationNodeData,
  GatewayNodeData,
} from '../types';

function ApplicationNodeComponent({ data, selected }: NodeProps<ApplicationNodeType>) {
  const appData = data as ApplicationNodeData;

  return (
    <div className={`application-node ${selected ? 'selected' : ''}`}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="application-handle" />

      {/* Header */}
      <div className="application-node-header">
        <span className="application-icon">📦</span>
        <span className="application-title">{appData.label}</span>
        {appData.version && (
          <span className="application-version">v{appData.version}</span>
        )}
      </div>

      {/* Gateway (if present) */}
      {appData.gateway && <ApplicationGateway gateway={appData.gateway} />}

      {/* Cells in this application */}
      {appData.cells.length > 0 && (
        <div className="application-cells">
          <div className="section-label">Cells</div>
          <div className="cells-list">
            {appData.cells.map((cellId) => (
              <span key={cellId} className="cell-ref-badge">
                {cellId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="application-handle" />
    </div>
  );
}

interface ApplicationGatewayProps {
  gateway: GatewayNodeData;
}

function ApplicationGateway({ gateway }: ApplicationGatewayProps) {
  return (
    <div className="application-gateway">
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
    </div>
  );
}

export const ApplicationNode = memo(ApplicationNodeComponent);

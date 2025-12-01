/**
 * Custom Node Components - Minimalist Excalidraw-style
 */

export { CellNode } from './CellNode';
export { ExternalNode } from './ExternalNode';
export { UserNode } from './UserNode';
export { ApplicationNode } from './ApplicationNode';
export { ComponentNode } from './ComponentNode';
export { GatewayNode } from './GatewayNode';
export { ErrorNode } from './ErrorNode';

// Export icons
export * from './icons';

import { CellNode } from './CellNode';
import { ExternalNode } from './ExternalNode';
import { UserNode } from './UserNode';
import { ApplicationNode } from './ApplicationNode';
import { ComponentNode } from './ComponentNode';
import { GatewayNode } from './GatewayNode';
import { ErrorNode } from './ErrorNode';

export const nodeTypes = {
  cell: CellNode,
  external: ExternalNode,
  user: UserNode,
  application: ApplicationNode,
  component: ComponentNode,
  gateway: GatewayNode,
  error: ErrorNode,
} as const;

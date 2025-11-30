/**
 * Custom Node Components
 */

export { CellNode } from './CellNode';
export { ExternalNode } from './ExternalNode';
export { UserNode } from './UserNode';

import { CellNode } from './CellNode';
import { ExternalNode } from './ExternalNode';
import { UserNode } from './UserNode';

export const nodeTypes = {
  cell: CellNode,
  external: ExternalNode,
  user: UserNode,
} as const;

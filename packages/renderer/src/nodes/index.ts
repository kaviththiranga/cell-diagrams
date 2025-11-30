/**
 * Custom Node Components
 */

export { CellNode } from './CellNode';
export { ExternalNode } from './ExternalNode';
export { UserNode } from './UserNode';
export { ApplicationNode } from './ApplicationNode';

import { CellNode } from './CellNode';
import { ExternalNode } from './ExternalNode';
import { UserNode } from './UserNode';
import { ApplicationNode } from './ApplicationNode';

export const nodeTypes = {
  cell: CellNode,
  external: ExternalNode,
  user: UserNode,
  application: ApplicationNode,
} as const;

/**
 * Custom Edge Components
 */

export { ConnectionEdge } from './ConnectionEdge';
export { InterCellEdge } from './InterCellEdge';

import { ConnectionEdge } from './ConnectionEdge';
import { InterCellEdge } from './InterCellEdge';

export const edgeTypes = {
  connection: ConnectionEdge,
  interCell: InterCellEdge,
} as const;

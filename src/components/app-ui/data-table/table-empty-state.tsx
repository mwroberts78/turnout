import { TableCell, TableRow } from '@/components/base-ui/table';

export function TableEmptyState({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        No results.
      </TableCell>
    </TableRow>
  );
}

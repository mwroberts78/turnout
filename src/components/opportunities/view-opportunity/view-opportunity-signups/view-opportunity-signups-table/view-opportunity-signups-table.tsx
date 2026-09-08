'use client';

import {
  type ColumnDef,
  type RowData,
  type SortingState,
  useTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  stickyCellClassName,
  stickyHeadClassName,
} from '@/components/app-ui/data-table/table-sticky-column';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/base-ui/table';
import {
  type DataTableFeatures,
  viewOpportunitySignupsTablefeatures,
} from './view-opportunity-signups-table-features';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  isAdmin: boolean;
}

export function ViewOpportunitySignupsTable<TData extends RowData>({
  columns,
  data,
  isAdmin,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useTable({
    features: viewOpportunitySignupsTablefeatures,
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
    initialState: {
      columnVisibility: isAdmin ? {} : { actions: false, email: false },
    },
  });

  return (
    <div className="overflow-hidden rounded-lg">
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <TableHead
                    key={header.id}
                    className={stickyHeadClassName(index, header.column.id)}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="group"
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={stickyCellClassName(index, cell.column.id)}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

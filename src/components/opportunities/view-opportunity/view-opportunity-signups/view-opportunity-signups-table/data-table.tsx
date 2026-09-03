'use client';

import {
  type ColumnDef,
  type RowData,
  type SortingState,
  useTable,
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type DataTableFeatures, features } from './features';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  isAdmin: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  isAdmin,
}: DataTableProps<TData>) {
  const [isMac, setIsMac] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
    initialState: {
      columnVisibility: isAdmin ? {} : { actions: false, email: false },
    },
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(/Mac/.test(navigator.platform));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isShortcut = isMac
        ? e.metaKey && e.key === 'k'
        : e.ctrlKey && e.key === 'k';
      if (isShortcut) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isMac]);

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
                    className={cn(
                      index === 0 && 'pl-4',
                      header.column.id === 'actions'
                        ? 'sticky right-0 z-10 bg-muted border-l text-center'
                        : undefined,
                    )}
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
                    className={cn(
                      index === 0 && 'pl-4',
                      cell.column.id === 'actions'
                        ? 'sticky right-0 z-10 border-l bg-background text-center group-hover:bg-muted group-data-[state=selected]:bg-muted'
                        : undefined,
                    )}
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
      {/* <div className="flex flex-col gap-4 border-t px-(--card-spacing) py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm ">
          <span>
            Results: {startRow} - {endRow} of {totalRows}
            {table.getFilteredSelectedRowModel().rows.length > 0 &&
              ` · ${table.getFilteredSelectedRowModel().rows.length} selected`}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-17.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => (
            <Button
              // biome-ignore lint/suspicious/noArrayIndexKey: i is fine here.
              key={i}
              variant={currentPage === i ? 'default' : 'outline'}
              size="icon"
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}
          {table.getPageCount() > 5 && (
            <>
              <span className="text-muted-foreground px-2">...</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              >
                {table.getPageCount()}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div> */}
    </div>
  );
}

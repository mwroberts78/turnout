'use client';

import {
  type ColumnDef,
  type RowData,
  type SortingState,
  useTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { typeLabels } from '@/db/schema';
import { type DataTableFeatures, features } from './features';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
}

export function DataTable<TData extends RowData>({
  columns,
  data,
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
    globalFilterFn: 'opportunitySearch',
    state: { sorting, globalFilter },
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPage = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const startRow = currentPage * pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pageSize, totalRows);

  const typeFilterValue = table.getColumn('opportunityType')?.getFilterValue();
  const statusFilterValue = table.getColumn('isPublished')?.getFilterValue();
  const hasActiveFilters =
    globalFilter !== '' ||
    typeFilterValue !== undefined ||
    statusFilterValue !== undefined;

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
    <div className="overflow-hidden">
      <div className="border-b flex items-center pt-1 pb-5 px-4 gap-4">
        <div className="relative max-w-sm">
          <Input
            ref={searchInputRef}
            placeholder="Search opportunities..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <KbdGroup className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 md:flex">
            <Kbd>{isMac ? '⌘K' : 'Ctrl+K'}</Kbd>
          </KbdGroup>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="opportunity-type-filter">Type</Label>
          <Select
            value={
              (table
                .getColumn('opportunityType')
                ?.getFilterValue() as string) ?? 'all'
            }
            onValueChange={(value) =>
              table
                .getColumn('opportunityType')
                ?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  value === 'all'
                    ? 'All Types'
                    : typeLabels[value as keyof typeof typeLabels]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="in-person">In Person</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="skills-based">Skills Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={
              table.getColumn('isPublished')?.getFilterValue() === undefined
                ? 'all'
                : table.getColumn('isPublished')?.getFilterValue()
                  ? 'published'
                  : 'draft'
            }
            onValueChange={(value) =>
              table
                .getColumn('isPublished')
                ?.setFilterValue(
                  value === 'all' ? undefined : value === 'published',
                )
            }
          >
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue>
                {(value: string) =>
                  value === 'all'
                    ? 'All Statuses'
                    : value === 'published'
                      ? 'Published'
                      : 'Draft'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setGlobalFilter('');
              table.getColumn('opportunityType')?.setFilterValue(undefined);
              table.getColumn('isPublished')?.setFilterValue(undefined);
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === 'actions'
                        ? 'sticky right-0 z-10 bg-muted border-l text-center'
                        : undefined
                    }
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === 'actions'
                        ? 'sticky right-0 z-10 border-l bg-background text-center group-hover:bg-muted group-data-[state=selected]:bg-muted'
                        : undefined
                    }
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
      <div className="flex flex-col gap-4 border-t px-(--card-spacing) py-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    </div>
  );
}

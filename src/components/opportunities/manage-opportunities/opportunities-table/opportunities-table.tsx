'use client';

import {
  type ColumnDef,
  type RowData,
  type SortingState,
  useTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { typeLabels } from '@/components/app-ui/app-opportunity-type';
import { TableEmptyState } from '@/components/app-ui/data-table/table-empty-state';
import { TablePagination } from '@/components/app-ui/data-table/table-pagination';
import { TableSearchInput } from '@/components/app-ui/data-table/table-search-input';
import {
  stickyCellClassName,
  stickyHeadClassName,
} from '@/components/app-ui/data-table/table-sticky-column';
import { Button } from '@/components/base-ui/button';
import { Label } from '@/components/base-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
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
  opportunitiesTableFeatures,
} from './opportunities-table-features';

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
}

export function OpportunitiesTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useTable({
    features: opportunitiesTableFeatures,
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'opportunitySearch',
    state: { sorting, globalFilter },
  });

  const typeFilterValue = table.getColumn('opportunityType')?.getFilterValue();
  const statusFilterValue = table.getColumn('isPublished')?.getFilterValue();
  const hasActiveFilters =
    globalFilter !== '' ||
    typeFilterValue !== undefined ||
    statusFilterValue !== undefined;

  return (
    <div className="overflow-hidden">
      <div className="border-b flex items-center pt-1 pb-5 px-4 gap-4">
        <TableSearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search opportunities..."
        />

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
            <TableEmptyState colSpan={columns.length} />
          )}
        </TableBody>
      </Table>
      <TablePagination
        pageIndex={table.state.pagination.pageIndex}
        pageSize={table.state.pagination.pageSize}
        pageCount={table.getPageCount()}
        totalRows={table.getFilteredRowModel().rows.length}
        selectedCount={table.getFilteredSelectedRowModel().rows.length}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        onPreviousPage={table.previousPage}
        onNextPage={table.nextPage}
        onPageIndexChange={table.setPageIndex}
        onPageSizeChange={table.setPageSize}
      />
    </div>
  );
}

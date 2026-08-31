import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';
import type { z } from 'zod';
import type { opportunityListItem } from '@/lib/schemas/opportunity-list-item';

type OpportunityListItem = z.infer<typeof opportunityListItem>;

function opportunitySearchFilter(
  row: { original: OpportunityListItem },
  _columnId: string,
  filterValue: unknown,
) {
  const search = String(filterValue).toLowerCase();
  const { description, location } = row.original;
  return (
    description?.toLowerCase().includes(search) ||
    (location ?? '').toLowerCase().includes(search)
  );
}

export const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  globalFilteringFeature,
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
    opportunitySearch: opportunitySearchFilter,
    equals: filterFn_equals,
  },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export type DataTableFeatures = typeof features;

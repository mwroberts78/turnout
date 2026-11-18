'use client';

import { useMemo, useState } from 'react';
import { typeLabels } from '@/components/app-ui/app-opportunity-type';
import { TableSearchInput } from '@/components/app-ui/data-table/table-search-input';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';
import { Label } from '@/components/base-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import { Switch } from '@/components/base-ui/switch';
import { opportunityTypeEnum } from '@/db/schema';
import type { PublishedOpportunity } from '@/lib/dal/opportunity';
import {
  type BrowseFilters,
  type BrowseSort,
  browseSortLabels,
  browseSorts,
  defaultBrowseFilters,
  filterOpportunities,
} from '@/lib/utils/browseOpportunities';
import { BrowseOpportunityCard } from './browse-opportunity-card';

const pageSize = 12;

export function BrowseOpportunitiesList({
  opportunities,
}: {
  opportunities: PublishedOpportunity[];
}) {
  const [filters, setFilters] = useState<BrowseFilters>(defaultBrowseFilters);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const matching = useMemo(
    () => filterOpportunities(opportunities, filters),
    [opportunities, filters],
  );

  const isFiltered =
    filters.search.trim() !== '' ||
    filters.type !== defaultBrowseFilters.type ||
    filters.openOnly !== defaultBrowseFilters.openOnly;

  // Any filter change starts the list over from the first page.
  function updateFilters(changes: Partial<BrowseFilters>) {
    setFilters((current) => ({ ...current, ...changes }));
    setVisibleCount(pageSize);
  }

  const visible = matching.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <TableSearchInput
          value={filters.search}
          onChange={(search) => updateFilters({ search })}
          placeholder="Search opportunities..."
          className="w-full sm:w-72"
        />

        <div className="flex items-center gap-2">
          <Label htmlFor="browse-type">Type</Label>
          <Select
            value={filters.type}
            onValueChange={(type) =>
              updateFilters({ type: type as BrowseFilters['type'] })
            }
          >
            <SelectTrigger id="browse-type" className="w-36">
              <SelectValue>
                {(value: BrowseFilters['type']) =>
                  value === 'all' ? 'All types' : typeLabels[value]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {opportunityTypeEnum.enumValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="browse-sort">Sort</Label>
          <Select
            value={filters.sort}
            onValueChange={(sort) =>
              updateFilters({ sort: sort as BrowseSort })
            }
          >
            <SelectTrigger id="browse-sort" className="w-40">
              <SelectValue>
                {(value: BrowseSort) => browseSortLabels[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {browseSorts.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {browseSortLabels[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="browse-open-only"
            checked={filters.openOnly}
            onCheckedChange={(openOnly) => updateFilters({ openOnly })}
          />
          <Label htmlFor="browse-open-only">Open spots only</Label>
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateFilters({
                search: '',
                type: defaultBrowseFilters.type,
                openOnly: defaultBrowseFilters.openOnly,
              })
            }
          >
            Clear filters
          </Button>
        )}
      </div>

      {matching.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No opportunities match your filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((opportunity) => (
              <BrowseOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {visible.length} of {matching.length}
            </span>
            {visible.length < matching.length && (
              <Button
                variant="outline"
                onClick={() => setVisibleCount((count) => count + pageSize)}
              >
                Show more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

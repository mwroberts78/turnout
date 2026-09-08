'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import type { z } from 'zod';
import { AppCapacityDisplay } from '@/components/app-ui/app-capacity-display';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions.menu';
import { Badge } from '@/components/base-ui/badge';
import { Button } from '@/components/base-ui/button';
import type { opportunityListItem } from '@/lib/schemas/opportunity-list-item';
import type { DataTableFeatures } from './opportunities-table-features';

const columnHelper = createColumnHelper<
  DataTableFeatures,
  z.infer<typeof opportunityListItem>
>();

export const opportunitiesTableColumns = columnHelper.columns([
  columnHelper.accessor('imageUrl', {
    id: 'opportunity',
    header: 'Opportunity',
    cell: (info) => {
      const imageUrl = info.getValue();

      return (
        <div className="flex min-w-0 items-center gap-3">
          {imageUrl && (
            <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md">
              <Image
                src={imageUrl}
                alt={info.row.original.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">
              {info.row.original.title}
            </div>
            <div className="text-muted-foreground text-xs">
              {info.row.original.location}
            </div>
          </div>
        </div>
      );
    },
  }),

  columnHelper.accessor('opportunityType', {
    id: 'opportunityType',
    header: 'Type',
    filterFn: 'equalsString',
    cell: (info) => {
      return (
        <AppOpportunityBadge
          opportunityType={info.row.original.opportunityType}
        />
      );
    },
  }),

  columnHelper.accessor('signupCount', {
    id: 'signups',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Capacity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    sortFn: 'signupPercent',
    cell: (info) => {
      const count = info.getValue();
      const max = info.row.original.maxSignupsAllowed;
      return (
        <div className="flex items-center gap-3">
          <AppCapacityDisplay count={count} max={max} />
        </div>
      );
    },
  }),

  columnHelper.accessor('startTime', {
    id: 'dateTime',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (info) => {
      const start = info.getValue();
      const end = info.row.original.endTime;

      return <AppDateTime start={start} end={end} />;
    },
  }),

  columnHelper.accessor('isPublished', {
    id: 'isPublished',
    header: 'Status',
    filterFn: 'equals',
    cell: (info) => {
      return (
        <Badge variant={info.getValue() ? 'default' : 'outline'}>
          {info.getValue() ? 'Published' : 'Draft'}
        </Badge>
      );
    },
  }),

  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const opportunity = info.row.original;
      return (
        <TableRowActionsMenu
          items={[
            {
              href: `/opportunities/manage/${opportunity.id}`,
              label: 'View details',
            },
            {
              label: 'Edit',
              href: `/opportunities/manage/${opportunity.id}/edit`,
            },
            {
              label: 'Delete',
              variant: 'destructive',
              href: `/opportunities/manage/${opportunity.id}/delete`,
            },
          ]}
        />
      );
    },
  }),
]);

'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { typeLabels } from '@/db/schema';
import type { opportunityListItem } from '@/lib/schemas/opportunity-list-item';
import { SignupProgress } from '../../signup-progress';
import type { DataTableFeatures } from './features';

const columnHelper = createColumnHelper<
  DataTableFeatures,
  z.infer<typeof opportunityListItem>
>();

export const columns = columnHelper.columns([
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
                sizes="32px"
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
        <Badge variant="outline" className={info.row.original.opportunityType}>
          {typeLabels[info.row.original.opportunityType]}
        </Badge>
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
        Signups
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    sortFn: 'signupPercent',
    cell: (info) => {
      const count = info.getValue();
      const max = info.row.original.maxSignupsAllowed;
      return (
        max !== null && (
          <div className="flex items-center gap-3">
            <SignupProgress count={count} max={max} />
            <span className="text-muted-foreground text-xs"></span>
          </div>
        )
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

      const date = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const startLabel = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      const endLabel = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-muted-foreground text-xs">
            {startLabel} - {endLabel}
          </span>
        </div>
      );
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 w-8 p-0" />}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup></DropdownMenuGroup>
            <DropdownMenuItem
              render={<Link href={`/opportunities/manage/${opportunity.id}`} />}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <Link href={`/opportunities/manage/${opportunity.id}/edit`} />
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);

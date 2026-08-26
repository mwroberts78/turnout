'use client';

import { createColumnHelper } from '@tanstack/react-table';
import Image from 'next/image';
import type { z } from 'zod';
import type { opportunityListItem } from '@/lib/schemas/opportunity-list-item';
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
                alt={info.row.original.description}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">
              {info.row.original.description}
            </div>
            <div className="text-muted-foreground text-xs">
              {info.row.original.location}
            </div>
          </div>
        </div>
      );
    },
  }),

  columnHelper.accessor('startTime', {
    id: 'dateTime',
    header: 'Date & Time',
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
]);

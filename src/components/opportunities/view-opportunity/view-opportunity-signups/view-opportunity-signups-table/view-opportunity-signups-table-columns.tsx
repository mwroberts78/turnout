'use client';

import { createColumnHelper } from '@tanstack/react-table';
import type { z } from 'zod';
import type { signupListItem } from '@/lib/schemas/signup-list-item';
import type { DataTableFeatures } from './view-opportunity-signups-table-features';
import { ViewOpportunitySignupsTableRowActions } from './view-opportunity-signups-table-row-actions';

const columnHelper = createColumnHelper<
  DataTableFeatures,
  z.infer<typeof signupListItem>
>();

export const viewOpportunitySignupsTableColumns = columnHelper.columns([
  columnHelper.accessor('user.firstName', {
    id: 'name',
    header: 'Name',
    cell: (info) => {
      return (
        <span>
          {info.row.original.user.firstName} {info.row.original.user.lastName}
        </span>
      );
    },
  }),

  columnHelper.accessor('user.email', {
    id: 'email',
    header: 'Email',
    cell: (info) => {
      return <span>{info.row.original.user.email}</span>;
    },
  }),

  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const signup = info.row.original;
      return <ViewOpportunitySignupsTableRowActions signup={signup} />;
    },
  }),
]);

'use client';

import { createColumnHelper } from '@tanstack/react-table';
import type { z } from 'zod';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions.menu';
import type { signupListItem } from '@/lib/schemas/signup-list-item';
import type { DataTableFeatures } from './view-opportunity-signups-table-features';

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
      return (
        <TableRowActionsMenu
          items={[
            {
              href: `/opportunities/manage/${signup.id}`,
              label: 'View details',
            },
            { label: 'Edit', href: `/opportunities/manage/${signup.id}/edit` },
            {
              label: 'Delete',
              variant: 'destructive',
              href: `/opportunities/manage/${signup.id}/delete`,
            },
          ]}
        />
      );
    },
  }),
]);

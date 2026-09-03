'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { signupListItem } from '@/lib/schemas/signup-list-item';
import type { DataTableFeatures } from './features';

const columnHelper = createColumnHelper<
  DataTableFeatures,
  z.infer<typeof signupListItem>
>();

export const columns = columnHelper.columns([
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
              render={<Link href={`/opportunities/manage/${signup.id}`} />}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/opportunities/manage/${signup.id}/edit`} />}
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

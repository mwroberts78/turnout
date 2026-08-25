'use client';

import {
  BookOpenIcon,
  CircleHelpIcon,
  LayoutGridIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  UserRoundIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const accounts = [
  {
    id: 'personal',
    name: 'Toby Belhome',
    handle: '@tobybelhome',
    avatar: 'https://i.pravatar.cc/150?img=1',
    fallback: 'TB',
  },
  {
    id: 'studio',
    name: 'Acme Studio',
    handle: '@acmestudio',
    avatar: 'https://i.pravatar.cc/150?img=12',
    fallback: 'AS',
  },
];

export default function UserMenu() {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeAccountId, setActiveAccountId] = React.useState(accounts[0].id);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeAccount =
    accounts.find((account) => account.id === activeAccountId) ?? accounts[0];

  const accountItems = (
    <>
      {accounts.map((account) => (
        <DropdownMenuItem
          key={account.id}
          onClick={() => setActiveAccountId(account.id)}
        >
          <Avatar className="size-7">
            <AvatarImage src={account.avatar} alt={account.name} />
            <AvatarFallback className="text-[10px]">
              {account.fallback}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 leading-tight">
            <span className="truncate font-medium">{account.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {account.handle}
            </span>
          </div>
          <span
            className={cn(
              'flex size-4.5 shrink-0 items-center justify-center rounded-full border',
              account.id === activeAccountId
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border',
            )}
          >
            {account.id === activeAccountId && (
              // Raw SVG with an explicit stroke: the menu item's hover
              // rule recolors `color` on every descendant, which wipes
              // out any currentColor-based icon on this dark circle.
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary-foreground)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <span className="border-border flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed">
          <PlusIcon className="size-4" />
        </span>
        Add account
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" />}>
        <Avatar>
          <AvatarImage src={activeAccount.avatar} alt={activeAccount.name} />
          <AvatarFallback className="rounded-lg">
            {activeAccount.fallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-3 px-1.5 py-2 text-left text-sm">
              <Avatar className="size-9">
                <AvatarImage
                  src={activeAccount.avatar}
                  alt={activeAccount.name}
                />
                <AvatarFallback className="rounded-lg">
                  {activeAccount.fallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeAccount.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {activeAccount.handle}
                </span>
              </div>
              <Badge>Pro</Badge>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isMobile ? (
            <>
              <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs">
                <UserRoundIcon className="size-4" />
                Account
              </DropdownMenuLabel>
              {accountItems}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserRoundIcon className="text-muted-foreground" />
                Account
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-60">
                {accountItems}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem render={<Link href="/dashboard/default" />}>
            <LayoutGridIcon className="text-muted-foreground" />
            Dashboard
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <CircleHelpIcon className="text-muted-foreground" />
            Help center
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookOpenIcon className="text-muted-foreground" />
            Guides
          </DropdownMenuItem>
          {mounted && (
            <DropdownMenuItem
              onSelect={(event) => {
                // Keep the menu open while flipping the theme.
                event.preventDefault();
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
            >
              <MoonIcon className="text-muted-foreground" />
              Dark mode
              <Switch checked={theme === 'dark'} className="ms-auto" />
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon className="text-muted-foreground" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

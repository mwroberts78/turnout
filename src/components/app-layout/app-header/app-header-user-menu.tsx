'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import { LogOutIcon, MoonIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/base-ui/avatar';
import { Badge } from '@/components/base-ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/base-ui/dropdown-menu';
import { Switch } from '@/components/base-ui/switch';
import type { AppUser } from '@/lib/types/appUser';

export function AppHeaderUserMenu({ appUser }: { appUser: AppUser }) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    appUser.status === 'active'
      ? `${appUser.firstName} ${appUser.lastName}`
      : (user?.fullName ?? 'Account');
  const displayEmail =
    appUser.status === 'active'
      ? appUser.email
      : (user?.primaryEmailAddress?.emailAddress ?? '');
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const role = appUser.status === 'active' ? appUser.role : undefined;
  const isPlatformAdmin = appUser.status === 'platform-admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" />}>
        <Avatar>
          <AvatarImage src={user?.imageUrl} alt={displayName} />
          <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-3 px-1.5 py-2 text-left text-sm">
              <Avatar className="size-9">
                <AvatarImage src={user?.imageUrl} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {displayEmail}
                </span>
              </div>
              {role === 'admin' && <Badge>Admin</Badge>}
              {isPlatformAdmin && <Badge>Internal Admin</Badge>}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
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
              <Switch
                checked={theme === 'dark'}
                className="ms-auto"
                onCheckedChange={(checked) =>
                  setTheme(checked ? 'dark' : 'light')
                }
              />
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton redirectUrl="/">
          <DropdownMenuItem>
            <LogOutIcon className="text-muted-foreground" />
            Log out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Notifications from '@/components/app-layout/header/notifications';
import UserMenu from '@/components/app-layout/header/user-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import type { AppUser } from '@/lib/types/appUser';

export function SiteHeader({ appUser }: { appUser: AppUser }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Notifications />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <UserMenu appUser={appUser} />
        </div>
      </div>
    </header>
  );
}

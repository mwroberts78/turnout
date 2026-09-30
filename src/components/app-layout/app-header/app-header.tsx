'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AppHeaderUserMenu } from '@/components/app-layout/app-header/app-header-user-menu';
import { Button } from '@/components/base-ui/button';
import { Separator } from '@/components/base-ui/separator';
import { useSidebar } from '@/components/base-ui/sidebar';
import type { AppUser } from '@/lib/types/appUser';

export function AppHeader({ appUser }: { appUser: AppUser }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {/* <Notifications /> */}
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <AppHeaderUserMenu appUser={appUser} />
        </div>
      </div>
    </header>
  );
}

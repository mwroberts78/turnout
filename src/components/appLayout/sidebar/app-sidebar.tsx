'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useEffect } from 'react';
import { useThemeConfig } from '@/components/active-theme';
import Logo from '@/components/appLayout/logo';
import { NavMain } from '@/components/appLayout/sidebar/nav-main';
import Search from '@/components/appLayout/sidebar/search';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsTablet } from '@/hooks/use-mobile';
import type { SidebarCollapsible, SidebarVariant } from '@/lib/themes';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const _pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const { theme } = useThemeConfig();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const prevIsTablet = React.useRef(isTablet);
  useEffect(() => {
    // On mount, keep the state restored from the cookie; only react to
    // actual breakpoint changes afterwards.
    if (prevIsTablet.current !== isTablet) {
      prevIsTablet.current = isTablet;
      setOpen(!isTablet);
    }
  }, [setOpen, isTablet]);

  return (
    <Sidebar
      collapsible={theme.sidebarCollapsible as SidebarCollapsible}
      variant={theme.sidebarVariant as SidebarVariant}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0!"
              render={<Link href="/dashboard/default" />}
            >
              <Logo />
              <span className="text-foreground font-semibold">
                Shadcn UI Kit
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Search />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full *:data-[slot=scroll-area-viewport]:scroll-fade">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}

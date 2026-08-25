import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import type React from 'react';
import { ActiveThemeProvider } from '@/components/active-theme';
import { SiteHeader } from '@/components/appLayout/header';
import { AppSidebar } from '@/components/appLayout/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  await auth.protect({ unauthenticatedUrl: '/sign-in' });

  const cookieStore = await cookies();
  const defaultOpen =
    cookieStore.get('sidebar_state')?.value === 'true' ||
    cookieStore.get('sidebar_state') === undefined;
  return (
    <ActiveThemeProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 64)',
            '--header-height': 'calc(var(--spacing) * 14)',
            '--content-padding': 'calc(var(--spacing) * 6)',
            '--content-margin': 'calc(var(--spacing) * 1.5)',
            '--content-full-height':
              'calc(100vh - var(--header-height) - (var(--content-padding) * 2.2) - (var(--content-margin) * 2.2))',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main p-(--content-padding) xl:group-data-[theme-content-layout=centered]/layout:max-w-7xl xl:group-data-[theme-content-layout=centered]/layout:w-full xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ActiveThemeProvider>
  );
}

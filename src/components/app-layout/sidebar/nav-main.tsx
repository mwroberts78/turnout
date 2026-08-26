'use client';

import {
  ChevronRight,
  ClipboardListIcon,
  HandHeartIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

type NavGroup = {
  title: string;
  items: NavItem;
};

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  isComing?: boolean;
  isDataBadge?: string;
  isNew?: boolean;
  newTab?: boolean;
  items?: NavItem;
  adminOnly?: boolean;
}[];

export const navItems: NavGroup[] = [
  {
    title: 'Programs',
    items: [
      {
        title: 'Opportunities',
        href: '/opportunities',
        icon: HandHeartIcon,
      },
      {
        title: 'Manage Opportunities',
        href: '/opportunities/manage',
        icon: ClipboardListIcon,
        adminOnly: true,
      },
    ],
  },
];

export function NavMain({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      {navItems.map((nav) => (
        <SidebarGroup key={nav.title}>
          <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {Array.isArray(item.items) && item.items.length > 0 ? (
                      <>
                        <div className="hidden group-data-[collapsible=icon]:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <SidebarMenuButton tooltip={item.title} />
                              }
                            >
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side={isMobile ? 'bottom' : 'right'}
                              align={isMobile ? 'end' : 'start'}
                              className="rounded-lg"
                            >
                              <DropdownMenuLabel>
                                {item.title}
                              </DropdownMenuLabel>
                              {item.items?.map((item) => (
                                <DropdownMenuItem
                                  key={item.title}
                                  render={
                                    <a href={item.href} aria-label={item.title}>
                                      {item.title}
                                    </a>
                                  }
                                />
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Collapsible
                          className="group/collapsible block group-data-[collapsible=icon]:hidden"
                          defaultOpen={
                            !!item.items.find((s) => s.href === pathname)
                          }
                        >
                          <CollapsibleTrigger
                            render={<SidebarMenuButton tooltip={item.title} />}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item?.items?.map((subItem, _key) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    isActive={pathname === subItem.href}
                                    render={
                                      <Link
                                        href={subItem.href}
                                        target={subItem.newTab ? '_blank' : ''}
                                      />
                                    }
                                  >
                                    <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        render={
                          <Link
                            href={item.href}
                            target={item.newTab ? '_blank' : ''}
                          />
                        }
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                    {!!item.isComing && (
                      <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                        Coming
                      </SidebarMenuBadge>
                    )}
                    {!!item.isNew && (
                      <SidebarMenuBadge className="border border-green-400 text-green-600 peer-hover/menu-button:text-green-600">
                        New
                      </SidebarMenuBadge>
                    )}
                    {!!item.isDataBadge && (
                      <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
                        {item.isDataBadge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

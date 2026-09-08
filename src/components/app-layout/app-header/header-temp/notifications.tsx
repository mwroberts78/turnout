import { BellIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/base-ui/avatar';
import { Button } from '@/components/base-ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/base-ui/dropdown-menu';
import { ScrollArea } from '@/components/base-ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

import { type Notification, notifications } from './data';

const Notifications = () => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="icon-sm" variant="ghost" className="relative" />}
      >
        <BellIcon />
        <span className="bg-destructive absolute inset-e-0.5 top-0.5 block size-1.5 shrink-0 rounded-full"></span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobile ? 'center' : 'end'}
        className="ms-4 w-80 p-0"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
            <div className="flex justify-between border-b px-6 py-4">
              <div className="font-medium">Notifications</div>
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                size="icon-sm"
                render={<Link href="/dashboard/pages/notifications" />}
              >
                View all
              </Button>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <ScrollArea className="h-87.5">
          {notifications.map((item: Notification, _key) => (
            <DropdownMenuItem
              key={item.title}
              className="group flex cursor-pointer items-start gap-9 rounded-none border-b px-4 py-3"
            >
              <div className="flex flex-1 items-start gap-2">
                <div className="flex-none">
                  <Avatar className="size-8">
                    <AvatarImage src={item.avatar} alt="" />
                    <AvatarFallback> {item.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="dark:group-hover:text-default-800 truncate text-sm font-medium">
                    {item.title}
                  </div>
                  <div className="dark:group-hover:text-default-700 text-muted-foreground line-clamp-1 text-xs">
                    {item.desc}
                  </div>
                  {item.type === 'confirm' && (
                    <div className="flex items-center gap-2">
                      <Button size="xs" variant="outline">
                        Accept
                      </Button>
                      <Button size="xs" variant="destructive">
                        Decline
                      </Button>
                    </div>
                  )}
                  <div className="dark:group-hover:text-default-500 text-muted-foreground flex items-center gap-1 text-xs">
                    <ClockIcon className="size-3!" />
                    {item.date}
                  </div>
                </div>
              </div>
              {item.unread_message && (
                <div className="flex-0">
                  <span className="bg-destructive/80 block size-2 rounded-full border" />
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;

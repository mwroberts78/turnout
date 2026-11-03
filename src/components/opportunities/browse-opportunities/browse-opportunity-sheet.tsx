'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/base-ui/sheet';

export function BrowseOpportunitySheet({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) router.back();
      }}
    >
      <SheetContent className="gap-0 overflow-y-auto p-0 duration-300 data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:data-starting-style:translate-x-full data-[side=right]:data-ending-style:translate-x-full">
        <SheetTitle className="sr-only">Opportunity details</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

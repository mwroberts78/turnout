'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/base-ui/skeleton';

export function AppDateTime({
  start,
  end,
  timeZone,
}: {
  start: Date;
  end: Date;
  timeZone?: string | null;
}) {
  const [viewerTimeZone, setViewerTimeZone] = useState<string | null>(null);

  useEffect(() => {
    if (!timeZone) {
      setViewerTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [timeZone]);

  if (!timeZone && !viewerTimeZone) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  const resolvedZone = timeZone ?? viewerTimeZone ?? undefined;

  const date = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: resolvedZone,
  });

  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: resolvedZone,
  });

  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: resolvedZone,
  });

  return (
    <div className="flex flex-col">
      <span>{date}</span>
      <span className="text-muted-foreground text-xs">
        {startLabel} - {endLabel}
      </span>
    </div>
  );
}

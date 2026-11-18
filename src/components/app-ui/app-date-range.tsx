'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/base-ui/skeleton';

// Formats a span of days in the viewer's time zone, e.g. "Mar 3 – 7, 2027".
// Rendered on the client so the server's time zone never leaks into the text.
export function AppDateRange({ start, end }: { start: Date; end: Date }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setLabel(format.formatRange(start, end));
  }, [start, end]);

  if (label === null) return <Skeleton className="inline-block h-4 w-32" />;

  return <span>{label}</span>;
}

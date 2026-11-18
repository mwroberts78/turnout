'use client';

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';
import { reportError } from '@/lib/utils/reportError';

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-md">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <TriangleAlert className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't load this page. Try again, and if it keeps happening,
            let your program admin know.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Go to dashboard
          </Button>
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </CardContent>
    </Card>
  );
}

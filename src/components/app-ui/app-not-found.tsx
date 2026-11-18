import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';

export function AppNotFound({ homeHref }: { homeHref: string }) {
  return (
    <Card className="mx-auto mt-10 w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <SearchX className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            This page doesn't exist, or it may have been removed or unpublished.
          </p>
        </div>
        <Button render={<Link href={homeHref} />} nativeButton={false}>
          Go back home
        </Button>
      </CardContent>
    </Card>
  );
}

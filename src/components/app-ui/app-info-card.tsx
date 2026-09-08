import type React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/base-ui/card';

export function AppInfoCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <Card className="flex gap-1 bg-muted/40 py-0">
      <CardHeader className="min-h-13 items-center py-2.5">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>

      <CardContent className="-mt-4 flex-1 rounded-lg bg-card p-(--card-spacing) shadow-2xs ring-1 ring-foreground/5">
        {children}
      </CardContent>
    </Card>
  );
}

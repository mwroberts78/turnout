import type { Metadata } from 'next';
import { AppNotFound } from '@/components/app-ui/app-not-found';

export const metadata: Metadata = { title: 'Not found' };

export default function RootNotFoundPage() {
  return (
    <main className="flex flex-1 items-start justify-center px-4">
      <AppNotFound homeHref="/" />
    </main>
  );
}

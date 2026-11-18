import type { Metadata } from 'next';
import { AppNotFound } from '@/components/app-ui/app-not-found';

export const metadata: Metadata = { title: 'Not found' };

export default function AppNotFoundPage() {
  return <AppNotFound homeHref="/dashboard" />;
}

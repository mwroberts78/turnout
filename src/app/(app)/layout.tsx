import { auth } from '@clerk/nextjs/server';
import type React from 'react';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  await auth.protect({ unauthenticatedUrl: '/sign-in' });
  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold">App Layout</h1>
      {children}
    </div>
  );
}

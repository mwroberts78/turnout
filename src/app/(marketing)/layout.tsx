import { auth } from '@clerk/nextjs/server';
import { HandHeart } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { Button } from '@/components/base-ui/button';
import { APP_NAME } from '@/lib/constants/app';

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactNode> {
  const { userId } = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HandHeart className="size-5 text-primary" />
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-2">
            {userId ? (
              <Button render={<Link href="/dashboard" />} nativeButton={false}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  render={<Link href="/sign-in" />}
                  nativeButton={false}
                >
                  Sign in
                </Button>
                <Button render={<Link href="/sign-up" />} nativeButton={false}>
                  Get started
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </footer>
    </div>
  );
}

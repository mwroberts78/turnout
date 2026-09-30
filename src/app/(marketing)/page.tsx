import Link from 'next/link';
import type React from 'react';

export default function MarketingHomePage(): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold">Turnout Marketing</h1>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

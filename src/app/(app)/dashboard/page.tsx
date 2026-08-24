import { SignOutButton } from '@clerk/nextjs';
import type React from 'react';

export default function DashboardHome(): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold">Turnout App</h1>
      <SignOutButton redirectUrl="/">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign Out
        </button>
      </SignOutButton>
    </div>
  );
}

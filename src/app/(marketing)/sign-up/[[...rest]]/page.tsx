import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = { title: 'Sign up' };

export default function SignUpPage(): React.ReactNode {
  return (
    <div className="flex flex-1 justify-center px-4 py-12">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

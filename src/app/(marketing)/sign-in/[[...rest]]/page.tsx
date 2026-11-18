import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage(): React.ReactNode {
  return (
    <div>
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

import { SignIn } from '@clerk/nextjs';
import type React from 'react';

export default function SignInPage(): React.ReactNode {
  return (
    <div>
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

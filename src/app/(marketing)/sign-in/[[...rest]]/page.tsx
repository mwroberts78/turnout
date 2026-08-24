import { SignIn } from '@clerk/nextjs';
import type React from 'react';

export default function Sign_In(): React.ReactNode {
  return (
    <div>
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

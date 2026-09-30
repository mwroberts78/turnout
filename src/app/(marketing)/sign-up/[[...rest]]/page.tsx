import { SignUp } from '@clerk/nextjs';
import type React from 'react';

export default function SignUpPage(): React.ReactNode {
  return (
    <div>
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

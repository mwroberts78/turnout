export type AppUser =
  | { status: 'signed-out' }
  | { status: 'no-org' }
  | { status: 'platform-admin' }
  | { status: 'pending-sync' }
  | {
      status: 'active';
      role: 'admin' | 'employee';
      firstName: string;
      lastName: string;
      email: string;
    };

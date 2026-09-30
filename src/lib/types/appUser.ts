export type AppUser =
  | { status: 'signed-out' }
  | { status: 'no-org' }
  | { status: 'pending-sync' }
  | {
      status: 'platform-admin';
      role: 'platform-admin';
      firstName: string;
      lastName: string;
      email: string;
    }
  | {
      tenantId: string;
      status: 'active';
      role: 'admin' | 'employee';
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };

export function isAppUserStatus<S extends AppUser['status']>(
  appUser: AppUser,
  ...statuses: S[]
): appUser is Extract<AppUser, { status: S }> {
  return (statuses as AppUser['status'][]).includes(appUser.status);
}

export function isAdminAppUser(
  appUser: AppUser,
): appUser is Extract<AppUser, { status: 'active' | 'platform-admin' }> {
  return isAppUserStatus(appUser, 'active', 'platform-admin');
}

export function isAdminUser(appUser: AppUser): boolean {
  return (
    appUser.status === 'platform-admin' ||
    (appUser.status === 'active' && appUser.role === 'admin')
  );
}

export type AdminAppUser = Extract<
  AppUser,
  { status: 'active' | 'platform-admin' }
>;

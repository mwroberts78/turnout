import { auth } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db } from '@/db';
import { tenants, users } from '@/db/schema';
import { env } from '@/env';
import type { AppUser } from './types/appUser';

export const getCurrentAppUser = cache(async (): Promise<AppUser> => {
  const { orgId, userId } = await auth();

  if (userId == null) return { status: 'signed-out' };

  if (orgId == null) return { status: 'no-org' };

  if (orgId === env.PLATFORM_ADMIN_ORG_ID) {
    return { status: 'platform-admin' };
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_clerk_user_id', ${userId}, true)`,
    );

    const user = await tx.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) return { status: 'pending-sync' };

    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${user.tenantId}, true)`,
    );

    const tenant = await tx.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) return { status: 'pending-sync' };

    return {
      status: 'active',
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  });
});

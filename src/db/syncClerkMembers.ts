// local-dev fallback for when the Clerk webhook can't reach the dev machine.
// pulls org memberships from Clerk and inserts any users missing locally.

import { isNull } from 'drizzle-orm';
import { db } from './index';
import { tenants, users } from './schema/index';

type ClerkMembership = {
  role: string;
  public_user_data: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    identifier: string;
  };
};

const secretKey = process.env.CLERK_SECRET_KEY;

if (!secretKey) {
  console.error('CLERK_SECRET_KEY is not set');
  process.exit(1);
}

async function fetchMemberships(clerkOrgId: string) {
  const res = await fetch(
    `https://api.clerk.com/v1/organizations/${clerkOrgId}/memberships?limit=100`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );

  if (!res.ok) {
    throw new Error(`Clerk API ${res.status} for org ${clerkOrgId}`);
  }

  const body = (await res.json()) as { data: ClerkMembership[] };

  return body.data;
}

async function main() {
  const allTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      clerkOrgId: tenants.clerkOrgId,
    })
    .from(tenants)
    .where(isNull(tenants.deletedAt));

  for (const tenant of allTenants) {
    const memberships = await fetchMemberships(tenant.clerkOrgId);

    for (const { role, public_user_data: member } of memberships) {
      const inserted = await db
        .insert(users)
        .values({
          tenantId: tenant.id,
          clerkUserId: member.user_id,
          email: member.identifier,
          firstName: member.first_name ?? '',
          lastName: member.last_name ?? '',
          role: role === 'org:admin' ? 'admin' : 'employee',
        })
        .onConflictDoNothing({ target: users.clerkUserId })
        .returning({ email: users.email });

      if (inserted.length > 0) {
        console.log(`Added ${member.identifier} to ${tenant.name}`);
      }
    }
  }
  console.log('Sync complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

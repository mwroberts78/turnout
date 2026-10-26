import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import {
  mealOptions,
  opportunities,
  signUps,
  tenants,
  type User,
  users,
} from '@/db/schema';
import type { AppUser } from '@/lib/types/appUser';

export async function createTestTenantAndAdmin() {
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'DAL Test Tenant',
      clerkOrgId: `dal-test-${crypto.randomUUID()}`,
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      clerkUserId: `dal-test-user-${crypto.randomUUID()}`,
      email: 'dal-test@example.com',
      firstName: 'DAL',
      lastName: 'Tester',
      role: 'admin',
    })
    .returning();

  return { tenant, admin };
}

export async function createTestVolunteer(tenantId: string) {
  const [volunteer] = await db
    .insert(users)
    .values({
      tenantId,
      clerkUserId: `dal-test-user-${crypto.randomUUID()}`,
      email: 'dal-test-volunteer@example.com',
      firstName: 'Vol',
      lastName: 'Unteer',
      role: 'employee',
    })
    .returning();

  return volunteer;
}

export function asActiveAppUser(user: User): AppUser {
  return {
    status: 'active',
    tenantId: user.tenantId,
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export async function cleanupTestTenant(tenantId: string) {
  await db.delete(signUps).where(eq(signUps.tenantId, tenantId));
  await db.delete(mealOptions).where(eq(mealOptions.tenantId, tenantId));
  await db.delete(opportunities).where(eq(opportunities.tenantId, tenantId));
  await db.delete(users).where(eq(users.tenantId, tenantId));
  await db.delete(tenants).where(eq(tenants.id, tenantId));
}

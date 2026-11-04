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
import { createOpportunity } from '@/lib/dal/opportunity';
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

export function baseOpportunityInput(
  overrides: Partial<Parameters<typeof createOpportunity>[2]> = {},
) {
  return {
    title: 'Park Cleanup',
    description: 'Bring gloves',
    opportunityType: 'virtual' as const,
    location: null,
    imageUrl: null,
    startTime: new Date('2026-06-01T14:00:00Z'),
    endTime: new Date('2026-06-01T16:00:00Z'),
    timeZone: null,
    hasPhysicalLocation: false,
    mealProvided: false,
    mealOptions: [],
    tshirtProvided: false,
    maxSignupsAllowed: null,
    ...overrides,
  };
}

export function daysFromNow(days: number, hour = 14) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

export async function createPublished(
  tenantId: string,
  adminId: string,
  overrides: Parameters<typeof baseOpportunityInput>[0] = {},
) {
  const oppId = await createOpportunity(
    tenantId,
    adminId,
    baseOpportunityInput({
      startTime: daysFromNow(7),
      endTime: daysFromNow(7, 16),
      ...overrides,
    }),
  );

  await db
    .update(opportunities)
    .set({ isPublished: true })
    .where(eq(opportunities.id, oppId));

  return oppId;
}

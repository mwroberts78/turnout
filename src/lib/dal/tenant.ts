import { eq } from 'drizzle-orm';
import type { NewTenant, Tenant } from '@/db/schema';
import { tenants } from '@/db/schema';
import { dbService } from '@/db/webhookServiceClient';
import type { DbClient } from './dbClient';

export async function createTenant(
  input: NewTenant,
  client: DbClient = dbService,
) {
  const existing = await findTenantByClerkOrgId(input.clerkOrgId, client);

  if (existing) {
    await client
      .update(tenants)
      .set({ deletedAt: null, deletedBy: null, name: input.name })
      .where(eq(tenants.id, existing.id));
    return;
  }

  await client
    .insert(tenants)
    .values({ clerkOrgId: input.clerkOrgId, name: input.name })
    .onConflictDoNothing({ target: tenants.clerkOrgId });
}

export async function updateTenant(
  tenantId: string,
  name: string,
  client: DbClient = dbService,
) {
  await client.update(tenants).set({ name }).where(eq(tenants.id, tenantId));
}

export async function deleteTenant(
  tenantId: string,
  client: DbClient = dbService,
) {
  await client
    .update(tenants)
    .set({ deletedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}

export async function findTenantByClerkOrgId(
  clerkOrgId: string,
  client: DbClient = dbService,
): Promise<Tenant | undefined> {
  const result = await client.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, clerkOrgId),
  });

  return result;
}

export async function findTenantById(
  tenantId: string,
  client: DbClient = dbService,
): Promise<Tenant | undefined> {
  const result = await client.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  return result;
}

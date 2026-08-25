import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { findTenantByClerkOrgId, updateTenant } from '@/lib/dal/tenant';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookOrgSchema } from './schemas';
import type { RawClerkOrgEvent, WebhookHandlerResult } from './types';

export async function handleOrganizationUpdated(
  rawEvent: RawClerkOrgEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> {
  const parsedData = clerkWebhookOrgSchema.safeParse(rawEvent);
  if (!parsedData.success) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const { id, name } = parsedData.data.data;

  if (id === env.PLATFORM_ADMIN_ORG_ID) {
    return { ok: true, skipped: true };
  }

  const tenant = await findTenantByClerkOrgId(id, client);

  if (!tenant) {
    reportError(new Error('Tenant not found for update'), { clerkOrg: id });

    return { ok: false, reason: 'tenant_not_found' };
  }

  try {
    await updateTenant(tenant.id, name, client);
  } catch (err) {
    reportError(err, { clerkOrgId: id, name });
    throw err;
  }
  return { ok: true, skipped: false };
}

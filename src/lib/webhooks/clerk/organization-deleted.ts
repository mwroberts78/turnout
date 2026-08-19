import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { deleteTenant, findTenantByClerkOrgId } from '@/lib/dal/tenant';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookOrgDelete } from './schemas';
import type { RawClerkOrgDeleteEvent, WebhookHandlerResult } from './types';

export const handleOrganizationDeleted = async (
  rawEvent: RawClerkOrgDeleteEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> => {
  const parsedData = clerkWebhookOrgDelete.safeParse(rawEvent);
  if (!parsedData.success) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const { id } = parsedData.data.data;

  if (id === env.PLATFORM_ADMIN_ORG_ID) {
    return { ok: true, skipped: true };
  }

  const tenant = await findTenantByClerkOrgId(id, client);

  if (!tenant) {
    reportError(new Error('Tenant not found for delete'), { clerkOrg: id });

    return { ok: false, reason: 'tenant_not_found' };
  }

  try {
    await deleteTenant(tenant.id, client);
  } catch (err) {
    reportError(err, { clerkOrgId: id, name: tenant.name });
    throw err;
  }
  return { ok: true, skipped: false };
};

import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { findTenantById } from '@/lib/dal/tenant';
import { deleteUser, findUserByClerkId } from '@/lib/dal/user';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookUserDelete } from './schemas';
import type { RawClerkUserDeleteEvent, WebhookHandlerResult } from './types';

export async function handleUserDeleted(
  rawEvent: RawClerkUserDeleteEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> {
  const parsedData = clerkWebhookUserDelete.safeParse(rawEvent);

  if (!parsedData.success) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const clerkUser = parsedData.data.data;

  const user = await findUserByClerkId(clerkUser.id, client);

  if (!user) {
    return { ok: false, reason: 'user_not_found' };
  }

  const tenant = await findTenantById(user.tenantId, client);

  if (!tenant) {
    return { ok: false, reason: 'tenant_not_found' };
  }

  if (tenant.clerkOrgId === env.PLATFORM_ADMIN_ORG_ID) {
    return { ok: true, skipped: true };
  }

  try {
    await deleteUser(user.id, client);
  } catch (err) {
    reportError(err, {
      tenantId: user.tenantId,
      userId: user.id,
    });

    throw err;
  }

  return { ok: true, skipped: false };
}

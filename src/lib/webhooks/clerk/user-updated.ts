import type { UpdateUser } from '@/db/schema';
import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { findTenantById } from '@/lib/dal/tenant';
import { findUserByClerkId, updateUser } from '@/lib/dal/user';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookUser } from './schemas';
import type { RawClerkUserEvent, WebhookHandlerResult } from './types';

export async function handleUserUpdated(
  rawEvent: RawClerkUserEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> {
  const parsedData = clerkWebhookUser.safeParse(rawEvent);

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

  const primaryEmail = clerkUser.email_addresses.find(
    (email) => email.id === clerkUser.primary_email_address_id,
  )?.email_address;

  try {
    await updateUser(
      user.id,
      {
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
        email: primaryEmail ?? '',
      } as UpdateUser,
      client,
    );
  } catch (err) {
    reportError(err, {
      clerkUserId: user.clerkUserId,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
      email: primaryEmail,
    });
    throw err;
  }

  return { ok: true, skipped: false };
}

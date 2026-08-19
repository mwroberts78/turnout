import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { createTenant } from '@/lib/dal/tenant';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookOrgSchema } from './schemas';
import type { RawClerkOrgEvent, WebhookHandlerResult } from './types';

export const handleOrganizationCreated = async (
  rawEvent: RawClerkOrgEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> => {
  const parsedData = clerkWebhookOrgSchema.safeParse(rawEvent);
  if (!parsedData.success) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const { id, name } = parsedData.data.data;

  if (id === env.PLATFORM_ADMIN_ORG_ID) {
    return { ok: true, skipped: true };
  }
  try {
    await createTenant({ clerkOrgId: id, name: name }, client);
  } catch (err) {
    reportError(err, { clerkOrgId: id, name });
    throw err;
  }
  return { ok: true, skipped: false };
};

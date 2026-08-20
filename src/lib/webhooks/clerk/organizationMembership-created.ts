import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { findTenantByClerkOrgId } from '@/lib/dal/tenant';
import { createUser } from '@/lib/dal/user';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookOrgMembership } from './schemas';
import type { RawClerkOrgMembershipEvent, WebhookHandlerResult } from './types';

export const handleOrganizationMembershipCreated = async (
  rawEvent: RawClerkOrgMembershipEvent,
  client: DbClient = dbService,
): Promise<WebhookHandlerResult> => {
  const parsedData = clerkWebhookOrgMembership.safeParse(rawEvent);

  if (!parsedData.success) {
    return { ok: false, reason: 'invalid_payload' };
  }

  const { organization, public_user_data, role } = parsedData.data.data;

  if (organization.id === env.PLATFORM_ADMIN_ORG_ID) {
    return { ok: true, skipped: true };
  }

  const tenant = await findTenantByClerkOrgId(organization.id, client);

  if (!tenant) {
    reportError(new Error('Tenant not found for organization membership'), {
      clerkOrg: organization.id,
    });

    return { ok: false, reason: 'tenant_not_found' };
  }

  const { user_id, first_name, last_name, identifier } = public_user_data;

  try {
    await createUser(
      {
        email: identifier,
        firstName: first_name,
        lastName: last_name,
        clerkUserId: user_id,
        tenantId: tenant.id,
        role: role === 'org:admin' ? 'admin' : 'employee',
      },
      client,
    );
  } catch (err) {
    reportError(err, { tenantId: tenant?.id, userID: user_id });

    throw err;
  }

  return { ok: true as const, skipped: false as const };
};

import type { UpdateUser } from '@/db/schema';
import { dbService } from '@/db/webhookServiceClient';
import { env } from '@/env';
import type { DbClient } from '@/lib/dal/dbClient';
import { findTenantByClerkOrgId } from '@/lib/dal/tenant';
import { findUserByClerkId, updateUser } from '@/lib/dal/user';
import { reportError } from '@/lib/utils/reportError';
import { clerkWebhookOrgMembership } from './schemas';
import type { RawClerkOrgMembershipEvent, WebhookHandlerResult } from './types';

export const handleOrganizationMembershipUpdated = async (
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
  const user = await findUserByClerkId(public_user_data.user_id, client);

  if (!tenant) {
    reportError(new Error('Tenant not found for organization membership'), {
      clerkOrg: organization.id,
    });

    return { ok: false, reason: 'tenant_not_found' };
  }

  if (!user) {
    reportError(new Error('User not found to update'), {
      clerkUser: public_user_data.user_id,
    });

    return { ok: false, reason: 'user_not_found' };
  }

  try {
    await updateUser(
      user.id,
      {
        role: role === 'org:admin' ? 'admin' : 'employee',
      } as UpdateUser,
      client,
    );
  } catch (err) {
    reportError(err, {
      tenantId: tenant.id,
      userId: user.id,
    });
    throw err;
  }

  return { ok: true as const, skipped: false as const };
};

import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { tenants, users } from '@/db/schema';
import { env } from '@/env';
import { handleOrganizationCreated } from '@/lib/webhooks/clerk/organization-created';
import { handleOrganizationMembershipCreated } from '@/lib/webhooks/clerk/organizationMembership-created';
import { handleOrganizationMembershipDeleted } from '@/lib/webhooks/clerk/organizationMembership-deleted';
import { handleOrganizationMembershipUpdated } from '@/lib/webhooks/clerk/organizationMembership-updated';
import { withRollback } from '../test-utils';

describe('handleOrganizationMembershipCreated', () => {
  test('creates an org membership from a valid organizationMembership.created event', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.firstName).toBe('FName');
      expect(user.lastName).toBe('LName');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('admin');
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            public_user_data: {
              user_id: 'org_test_user_bad',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          } as never,
        },
        tx,
      );

      expect(org_membership_result).toEqual({
        ok: false,
        reason: 'invalid_payload',
      });
    });
  });

  test('rejects if tenant not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: 'org_test_123_not_found',
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({
        ok: false,
        reason: 'tenant_not_found',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeUndefined();
    });
  });

  test('skips the platform admin org without creating membership or user', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const [staleTenant] = await tx
        .insert(tenants)
        .values({
          clerkOrgId: env.PLATFORM_ADMIN_ORG_ID,
          name: 'Turnout Internal',
        })
        .returning();

      const [staleUser] = await tx
        .insert(users)
        .values({
          tenantId: staleTenant.id,
          clerkUserId: 'org_test_user',
          email: 'test@test.com',
          firstName: 'FName',
          lastName: 'LName',
        })
        .returning();

      const org_membership_updated_result =
        await handleOrganizationMembershipCreated(
          {
            type: 'organizationMembership.created',
            data: {
              organization: {
                id: env.PLATFORM_ADMIN_ORG_ID,
              },
              role: 'org:admin',
              public_user_data: {
                user_id: 'org_test_user_new',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_updated_result).toEqual({
        ok: true,
        skipped: true,
      });

      const [created_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user_new'));

      expect(created_user).toBeUndefined();

      const [original_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(original_user).toBeDefined();
      expect(original_user.updatedAt).toEqual(staleUser.updatedAt);
    });
  });

  test('sets user role to "employee" if anything but "org:admin"', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:some_non_existent_role',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.firstName).toBe('FName');
      expect(user.lastName).toBe('LName');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('employee');
    });
  });
});

describe('handleOrganizationMembershipUpdated', () => {
  test('updates an org membership from a valid organizationMembership.updated event - should only update role', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();

      const org_membership_updated_result =
        await handleOrganizationMembershipUpdated(
          {
            type: 'organizationMembership.updated',
            data: {
              organization: {
                id: tenant.clerkOrgId,
              },
              role: 'org:member',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName - Updated',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_updated_result).toEqual({
        ok: true,
        skipped: false,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.role).toBe('employee');
      expect(updated_user.firstName).toBe('FName');
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipUpdated(
        {
          type: 'organizationMembership.updated',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            public_user_data: {
              user_id: 'org_test_user_bad',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          } as never,
        },
        tx,
      );

      expect(org_membership_result).toEqual({
        ok: false,
        reason: 'invalid_payload',
      });
    });
  });

  test('rejects if tenant not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipUpdated(
        {
          type: 'organizationMembership.updated',
          data: {
            organization: {
              id: 'org_test_123_not_found',
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({
        ok: false,
        reason: 'tenant_not_found',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeUndefined();
    });
  });

  test('skips the platform admin org without updating membership or user', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const [staleTenant] = await tx
        .insert(tenants)
        .values({
          clerkOrgId: env.PLATFORM_ADMIN_ORG_ID,
          name: 'Turnout Internal',
        })
        .returning();

      await tx
        .insert(users)
        .values({
          tenantId: staleTenant.id,
          clerkUserId: 'org_test_user',
          email: 'test@test.com',
          firstName: 'FName',
          lastName: 'LName',
          role: 'admin',
        })
        .returning();

      const org_membership_updated_result =
        await handleOrganizationMembershipUpdated(
          {
            type: 'organizationMembership.updated',
            data: {
              organization: {
                id: env.PLATFORM_ADMIN_ORG_ID,
              },
              role: 'org:member',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_updated_result).toEqual({
        ok: true,
        skipped: true,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.role).toBe('admin');
    });
  });

  test('sets user role to "employee" if anything but "org:admin"', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.role).toBe('admin');

      const org_membership_updated_result =
        await handleOrganizationMembershipUpdated(
          {
            type: 'organizationMembership.updated',
            data: {
              organization: {
                id: tenant.clerkOrgId,
              },
              role: 'org:some_non_existent_role',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_updated_result).toEqual({
        ok: true,
        skipped: false,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.role).toBe('employee');
    });
  });
});

describe('handleOrganizationMembershipDeleted', () => {
  test('deletes an user from a valid organizationMembership.deleted event', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();

      const org_membership_deleted_result =
        await handleOrganizationMembershipDeleted(
          {
            type: 'organizationMembership.deleted',
            data: {
              organization: {
                id: tenant.clerkOrgId,
              },
              role: 'org:member',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName - Updated',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_deleted_result).toEqual({
        ok: true,
        skipped: false,
      });

      const [deleted_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(deleted_user).toBeDefined();
      expect(deleted_user.deletedAt).toBeInstanceOf(Date);
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: tenant.clerkOrgId,
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();

      const org_membership_deleted_result =
        await handleOrganizationMembershipDeleted(
          {
            type: 'organizationMembership.deleted',
            data: {
              organization: {
                id: tenant.clerkOrgId,
              },
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            } as never,
          },
          tx,
        );

      expect(org_membership_deleted_result).toEqual({
        ok: false,
        reason: 'invalid_payload',
      });
    });
  });

  test('rejects if tenant not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: 'org_test_123',
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const org_membership_tenant_not_found_result =
        await handleOrganizationMembershipDeleted(
          {
            type: 'organizationMembership.updated',
            data: {
              organization: {
                id: 'org_test_123_not_Found',
              },
              role: 'org:admin',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_tenant_not_found_result).toEqual({
        ok: false,
        reason: 'tenant_not_found',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();
    });
  });

  test('rejects if user not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const tenant_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(tenant_result).toEqual({ ok: true, skipped: false });

      const org_membership_result = await handleOrganizationMembershipCreated(
        {
          type: 'organizationMembership.created',
          data: {
            organization: {
              id: 'org_test_123',
            },
            role: 'org:admin',
            public_user_data: {
              user_id: 'org_test_user',
              first_name: 'FName',
              last_name: 'LName',
              identifier: 'test@test.com',
            },
          },
        },
        tx,
      );

      expect(org_membership_result).toEqual({ ok: true, skipped: false });

      const org_membership_user_not_found_result =
        await handleOrganizationMembershipDeleted(
          {
            type: 'organizationMembership.updated',
            data: {
              organization: {
                id: 'org_test_123',
              },
              role: 'org:admin',
              public_user_data: {
                user_id: 'org_test_user_not_found',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_user_not_found_result).toEqual({
        ok: false,
        reason: 'user_not_found',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();
    });
  });

  test('skips the platform admin org without deleting membership or user', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const [staleTenant] = await tx
        .insert(tenants)
        .values({
          clerkOrgId: env.PLATFORM_ADMIN_ORG_ID,
          name: 'Turnout Internal',
        })
        .returning();

      await tx.insert(users).values({
        tenantId: staleTenant.id,
        clerkUserId: 'org_test_user',
        email: 'test@test.com',
        firstName: 'FName',
        lastName: 'LName',
      });

      const org_membership_deleted_result =
        await handleOrganizationMembershipDeleted(
          {
            type: 'organizationMembership.deleted',
            data: {
              organization: {
                id: env.PLATFORM_ADMIN_ORG_ID,
              },
              role: 'org:admin',
              public_user_data: {
                user_id: 'org_test_user',
                first_name: 'FName',
                last_name: 'LName',
                identifier: 'test@test.com',
              },
            },
          },
          tx,
        );

      expect(org_membership_deleted_result).toEqual({
        ok: true,
        skipped: true,
      });

      const [deleted_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(deleted_user).toBeDefined();
      expect(deleted_user.deletedAt).toBeNull();
    });
  });
});

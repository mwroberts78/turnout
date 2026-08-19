import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { tenants, users } from '@/db/schema';
import { env } from '@/env';
import { handleOrganizationCreated } from '@/lib/webhooks/clerk/organization-created';
import { handleOrganizationMembershipCreated } from '@/lib/webhooks/clerk/organizationMembership-created';
import { handleUserDeleted } from '@/lib/webhooks/clerk/user-deleted';
import { handleUserUpdated } from '@/lib/webhooks/clerk/user-updated';
import { withRollback } from '../test-utils';

describe('handleUserUpdated', () => {
  test('updates user from a valid user.updated event', async () => {
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.firstName).toBe('FName');
      expect(user.lastName).toBe('LName');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('admin');

      const updated_user_result = await handleUserUpdated(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user',
            first_name: 'FName-Updated',
            last_name: 'LName-Updated',
            primary_email_address_id: 'primary-email-id',
            email_addresses: [
              {
                email_address: 'test-updated@test.com',
                id: 'primary-email-id',
              },
            ],
          },
        },
        tx,
      );

      expect(updated_user_result).toEqual({
        ok: true,
        skipped: false,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.firstName).toBe('FName-Updated');
      expect(updated_user.lastName).toBe('LName-Updated');
      expect(updated_user.email).toBe('test-updated@test.com');
      expect(updated_user.role).toBe('admin');
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

      const updated_user_result = await handleUserUpdated(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user',
            first_name: 'FName-Updated',
            last_name: 'LName-Updated',
            email_addresses: [
              {
                email_address: 'test-updated@test.com',
                id: 'primary-email-id',
              },
            ],
          } as never,
        },
        tx,
      );

      expect(updated_user_result).toEqual({
        ok: false,
        reason: 'invalid_payload',
      });
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.firstName).toBe('FName');
      expect(user.lastName).toBe('LName');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('admin');

      const updated_user_result = await handleUserUpdated(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user_not_found',
            first_name: 'FName-Updated',
            last_name: 'LName-Updated',
            primary_email_address_id: 'primary-email-id',
            email_addresses: [
              {
                email_address: 'test-updated@test.com',
                id: 'primary-email-id',
              },
            ],
          },
        },
        tx,
      );

      expect(updated_user_result).toEqual({
        ok: false,
        reason: 'user_not_found',
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.firstName).toBe('FName');
      expect(updated_user.lastName).toBe('LName');
      expect(updated_user.email).toBe('test@test.com');
      expect(updated_user.role).toBe('admin');
    });
  });

  test('skips the platform admin org without updating user', async () => {
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
        role: 'admin',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.firstName).toBe('FName');
      expect(user.lastName).toBe('LName');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('admin');

      const updated_user_result = await handleUserUpdated(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user',
            first_name: 'FName-Updated',
            last_name: 'LName-Updated',
            primary_email_address_id: 'primary-email-id',
            email_addresses: [
              {
                email_address: 'test-updated@test.com',
                id: 'primary-email-id',
              },
            ],
          },
        },
        tx,
      );

      expect(updated_user_result).toEqual({
        ok: true,
        skipped: true,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.firstName).toBe('FName');
      expect(updated_user.lastName).toBe('LName');
      expect(updated_user.email).toBe('test@test.com');
      expect(updated_user.role).toBe('admin');
    });
  });

  test('updates user email with primary Clerk email only', async () => {
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.email).toBe('test@test.com');

      const updated_user_result = await handleUserUpdated(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user',
            first_name: 'FName-Updated',
            last_name: 'LName-Updated',
            primary_email_address_id: 'primary-email-id-primary',
            email_addresses: [
              {
                email_address: 'test-updated1@test.com',
                id: 'primary-email-id1',
              },
              {
                email_address: 'test-updated2@test.com',
                id: 'primary-email-id2',
              },
              {
                email_address: 'test-updated3@test.com',
                id: 'primary-email-id3',
              },
              {
                email_address: 'test-updated-primary@test.com',
                id: 'primary-email-id-primary',
              },
            ],
          },
        },
        tx,
      );

      expect(updated_user_result).toEqual({
        ok: true,
        skipped: false,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.email).toBe('test-updated-primary@test.com');
    });
  });
});

describe('handleUserDeleted', () => {
  test('deletes user from a valid user.deleted event', async () => {
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();

      const deleted_user_result = await handleUserDeleted(
        {
          type: 'user.deleted',
          data: {
            id: 'org_test_user',
          },
        },
        tx,
      );

      expect(deleted_user_result).toEqual({
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();

      const deleted_user_result = await handleUserDeleted(
        {
          type: 'user.deleted',
          data: {},
        } as never,
        tx,
      );

      expect(deleted_user_result).toEqual({
        ok: false,
        reason: 'invalid_payload',
      });

      const [deleted_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(deleted_user).toBeDefined();
      expect(deleted_user.deletedAt).toBeNull();
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

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();

      const deleted_user_result = await handleUserDeleted(
        {
          type: 'user.deleted',
          data: {
            id: 'org_test_user_not_found',
          },
        } as never,
        tx,
      );

      expect(deleted_user_result).toEqual({
        ok: false,
        reason: 'user_not_found',
      });

      const [deleted_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(deleted_user).toBeDefined();
      expect(deleted_user.deletedAt).toBeNull();
    });
  });

  test('skips the platform admin org without updating user', async () => {
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
        role: 'admin',
      });

      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(user).toBeDefined();
      expect(user.deletedAt).toBeNull();

      const deleted_user_result = await handleUserDeleted(
        {
          type: 'user.updated',
          data: {
            id: 'org_test_user',
          },
        },
        tx,
      );

      expect(deleted_user_result).toEqual({
        ok: true,
        skipped: true,
      });

      const [updated_user] = await tx
        .select()
        .from(users)
        .where(eq(users.clerkUserId, 'org_test_user'));

      expect(updated_user).toBeDefined();
      expect(updated_user.deletedAt).toBeNull();
    });
  });
});

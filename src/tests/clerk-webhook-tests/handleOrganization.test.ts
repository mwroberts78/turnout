import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { tenants } from '@/db/schema';
import { env } from '@/env';
import { handleOrganizationCreated } from '@/lib/webhooks/clerk/organization-created';
import { handleOrganizationDeleted } from '@/lib/webhooks/clerk/organization-deleted';
import { handleOrganizationUpdated } from '@/lib/webhooks/clerk/organization-updated';
import { withRollback } from '../test-utils';

describe('handleOrganizationCreated', () => {
  test('creates a tenant from a valid organization.created event', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_bad' },
        } as never,
        tx,
      );

      expect(result).toEqual({ ok: false, reason: 'invalid_payload' });
    });
  });

  test('skips the platform admin org without creating a tenant', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: env.PLATFORM_ADMIN_ORG_ID, name: 'Turnout Internal' },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: true });
    });
  });

  test('reactivates a soft-deleted tenant when organization.created fires again for the same organization', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const created_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(created_result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();

      const deleted_result = await handleOrganizationDeleted(
        { type: 'organization.deleted', data: { id: 'org_test_123' } },
        tx,
      );

      expect(deleted_result).toEqual({ ok: true, skipped: false });

      const [deleted_tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(deleted_tenant.deletedAt).toBeInstanceOf(Date);

      const recreated_result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: {
            id: 'org_test_123',
            name: 'Acme Co Reborn',
          },
        },
        tx,
      );

      expect(recreated_result).toEqual({ ok: true, skipped: false });

      const [reactivated_tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(reactivated_tenant).toBeDefined();
      expect(reactivated_tenant.id).toBe(tenant.id);
      expect(reactivated_tenant.deletedAt).toBeNull();
      expect(reactivated_tenant.name).toBe('Acme Co Reborn');
    });
  });
});

describe('handleOrganizationUpdated', () => {
  test('updates a tenant from a valid organization.updated event', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const updated_result = await handleOrganizationUpdated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co Updated' },
        },
        tx,
      );

      expect(updated_result).toEqual({ ok: true, skipped: false });

      const [updated_tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(updated_tenant).toBeDefined();
      expect(updated_tenant.name).toBe('Acme Co Updated');
    });
  });

  test('rejects if tenant not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationUpdated(
        {
          type: 'organization.updated',
          data: { id: 'org_test_123_bad', name: 'Acme Co' },
        },
        tx,
      );

      expect(result).toEqual({ ok: false, reason: 'tenant_not_found' });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123_bad'));

      expect(tenant).toBeUndefined();
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationUpdated(
        {
          type: 'organization.updated',
          data: { id: 'org_test_bad_updated' },
        } as never,
        tx,
      );

      expect(result).toEqual({ ok: false, reason: 'invalid_payload' });
    });
  });

  test('skips the platform admin org without updating a tenant', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationUpdated(
        {
          type: 'organization.updated',
          data: {
            id: env.PLATFORM_ADMIN_ORG_ID,
            name: 'Turnout Internal Updated',
          },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: true });
    });
  });
});

describe('handleOrganizationDeleted', () => {
  test('deletes a tenant from a valid organization.deleted event', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationCreated(
        {
          type: 'organization.created',
          data: { id: 'org_test_123', name: 'Acme Co' },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: false });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Acme Co');

      const deleted_result = await handleOrganizationDeleted(
        {
          type: 'organization.deleted',
          data: { id: 'org_test_123' },
        },
        tx,
      );

      expect(deleted_result).toEqual({ ok: true, skipped: false });

      const [deleted_tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123'));

      expect(deleted_tenant).toBeDefined();
      expect(deleted_tenant.deletedAt).toBeInstanceOf(Date);
    });
  });

  test('rejects if tenant not found', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationDeleted(
        {
          type: 'organization.deleted',
          data: { id: 'org_test_123_bad' },
        },
        tx,
      );

      expect(result).toEqual({ ok: false, reason: 'tenant_not_found' });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, 'org_test_123_bad'));

      expect(tenant).toBeUndefined();
    });
  });

  test('rejects an invalid payload shape', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      const result = await handleOrganizationDeleted(
        {
          type: 'organization.deleted',
          data: { name: 'Bad Organization' },
        } as never,
        tx,
      );

      expect(result).toEqual({ ok: false, reason: 'invalid_payload' });
    });
  });

  test('skips the platform admin org without deleting a tenant', async () => {
    await withRollback(async (tx, _actAs, actAsWebhookService) => {
      await actAsWebhookService();

      await tx
        .insert(tenants)
        .values({
          clerkOrgId: env.PLATFORM_ADMIN_ORG_ID,
          name: 'Turnout Internal',
        })
        .returning();

      const result = await handleOrganizationDeleted(
        {
          type: 'organization.deleted',
          data: {
            id: env.PLATFORM_ADMIN_ORG_ID,
          },
        },
        tx,
      );

      expect(result).toEqual({ ok: true, skipped: true });

      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, env.PLATFORM_ADMIN_ORG_ID));
      expect(tenant).toBeDefined();
      expect(tenant.deletedAt).toBeNull();
    });
  });
});

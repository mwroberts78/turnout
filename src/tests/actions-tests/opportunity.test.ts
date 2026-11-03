import { del } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { opportunities, signUps } from '@/db/schema';
import {
  deleteOpportunityAction,
  saveOpportunityAction,
  togglePublishOpportunityAction,
} from '@/lib/actions/opportunity';
import { getCurrentAppUser } from '@/lib/auth';
import { createOpportunity } from '@/lib/dal/opportunity';
import {
  asActiveAppUser,
  cleanupTestTenant,
  createTestTenantAndAdmin,
  createTestVolunteer,
} from '../dal-tests/dal-test-utils';

vi.mock('@/lib/auth', () => ({
  getCurrentAppUser: vi.fn(),
}));

function baseFormInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Park Cleanup',
    description: null,
    opportunityType: 'virtual' as const,
    location: null,
    imageUrl: null,
    startTime: '2026-06-01T10:00',
    endTime: '2026-06-01T12:00',
    timeZone: null,
    hasPhysicalLocation: false,
    mealProvided: false,
    mealOptions: [],
    tshirtProvided: false,
    maxSignupsAllowed: '',
    ...overrides,
  };
}

describe('opportunity actions', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  describe('deleteOpportunityAction', () => {
    it('throws Not authorized for a non-admin user and leaves the row untouched', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues(),
      );

      await expect(deleteOpportunityAction(oppId)).rejects.toThrow(
        'Not authorized',
      );

      const [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.deletedAt).toBeNull();
    });

    it('throws Not authorized when signed out', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'signed-out' });

      await expect(
        deleteOpportunityAction(crypto.randomUUID()),
      ).rejects.toThrow('Not authorized');
    });

    it('soft-deletes the opportunity and revalidates for an admin', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues(),
      );

      await deleteOpportunityAction(oppId);

      const [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.deletedAt).not.toBeNull();
      expect(revalidatePath).toHaveBeenCalledWith('/opportunities/manage');
    });
  });

  describe('togglePublishOpportunityAction', () => {
    it('throws Not authorized for a non-admin user', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues(),
      );

      await expect(togglePublishOpportunityAction(oppId)).rejects.toThrow(
        'Not authorized',
      );
    });

    it('flips isPublished and revalidates for an admin', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues(),
      );

      await togglePublishOpportunityAction(oppId);

      const [row] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(row.isPublished).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith(
        `/opportunities/manage/${oppId}`,
      );
    });
  });

  describe('saveOpportunityAction', () => {
    it('throws Not authorized for a non-admin user', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      await expect(
        saveOpportunityAction(null, baseFormInput(), 'UTC'),
      ).rejects.toThrow('Not authorized');
    });

    it('rejects an invalid browser time zone without touching the DB', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await saveOpportunityAction(
        null,
        baseFormInput(),
        'Not/AZone',
      );

      expect(result).toEqual({
        success: false,
        message: 'Invalid time zone',
      });
    });

    it('returns Opportunity not found for an oppId that does not exist', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await saveOpportunityAction(
        crypto.randomUUID(),
        baseFormInput(),
        'UTC',
      );

      expect(result).toEqual({
        success: false,
        message: 'Opportunity not found',
      });
    });

    it('returns a validation message for invalid form input', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await saveOpportunityAction(
        null,
        baseFormInput({ title: '' }),
        'UTC',
      );

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
    });

    it('creates a new opportunity and revalidates', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));

      const result = await saveOpportunityAction(null, baseFormInput(), 'UTC');

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith('/opportunities/manage');
    });

    it('rejects shrinking capacity below the current signup count', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues(),
      );
      const volunteer = await createTestVolunteer(tenant.id);
      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        createdBy: volunteer.id,
      });

      const result = await saveOpportunityAction(
        oppId,
        baseFormInput({ maxSignupsAllowed: '0' }),
        'UTC',
      );

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
    });

    it('translates OpportunityConflictError into a failure result', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues({ tshirtProvided: true }),
      );
      const volunteer = await createTestVolunteer(tenant.id);
      await db.insert(signUps).values({
        tenantId: tenant.id,
        userId: volunteer.id,
        opportunityId: oppId,
        estimatedHours: 2,
        wantsTShirt: true,
        tshirtSize: 'md',
        createdBy: volunteer.id,
      });

      const result = await saveOpportunityAction(
        oppId,
        baseFormInput({ tshirtProvided: false }),
        'UTC',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toMatch(/t-shirt/);
      }
    });

    it('deletes the previous blob image when it changes on update', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const oldImageUrl =
        'https://abc123.public.blob.vercel-storage.com/old.jpg';
      const oppId = await createOpportunity(
        tenant.id,
        admin.id,
        baseOpportunityValues({ imageUrl: oldImageUrl }),
      );

      const result = await saveOpportunityAction(
        oppId,
        baseFormInput({
          imageUrl: 'https://abc123.public.blob.vercel-storage.com/new.jpg',
        }),
        'UTC',
      );

      expect(result.success).toBe(true);
      expect(del).toHaveBeenCalledWith(oldImageUrl);
    });
  });
});

function baseOpportunityValues(
  overrides: Partial<Parameters<typeof createOpportunity>[2]> = {},
) {
  return {
    title: 'Park Cleanup',
    description: null,
    opportunityType: 'virtual' as const,
    location: null,
    imageUrl: null,
    startTime: new Date('2026-06-01T14:00:00Z'),
    endTime: new Date('2026-06-01T16:00:00Z'),
    timeZone: null,
    hasPhysicalLocation: false,
    mealProvided: false,
    mealOptions: [],
    tshirtProvided: false,
    maxSignupsAllowed: null,
    ...overrides,
  };
}

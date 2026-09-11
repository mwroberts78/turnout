import { eq } from 'drizzle-orm';
import { signUps } from '@/db/schema';
import { mockDelay } from '../utils/mockDelay';
import { withTenantContext } from './withTenantContext';

export async function deleteSignUp(
  signUpId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  await withTenantContext(tenantId, (tx) =>
    tx
      .update(signUps)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(eq(signUps.id, signUpId)),
  );
}
